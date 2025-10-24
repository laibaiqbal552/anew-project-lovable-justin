# Testing Guide - Loading Improvements

## Quick Start Testing

### 1. **Test Global Splash Screen**
**What to test:** App initialization splash screen appears when loading the app
- Open the app in a fresh browser tab
- You should see:
  - Blue gradient background with floating animated blobs
  - TopServ logo with spinning animation
  - 4-step progress indicator
  - Progress bar animating from 0% to 100%
  - After ~1.5 seconds, splash screen fades out and app loads

**Expected behavior:**
- Smooth fade-out transition
- No flashing or jumping
- Progress should feel natural (not too fast/slow)

---

### 2. **Test Analysis Page Progress**
**What to test:** Enhanced progress visualization during brand analysis
**Steps:**
1. Navigate to `/analysis` or start a new analysis
2. Observe the loading steps:

**Expected visual improvements:**
- ✓ Steps fade in sequentially with stagger effect
- ✓ Step boxes have gradient background when processing
- ✓ Step numbers have colored circles (gray → brand blue → green)
- ✓ Processing step has animated gradient background
- ✓ Completed steps show green checkmarks with scaling animation
- ✓ Overall progress bar at top shows percentage
- ✓ Individual step progress bars show detailed progress
- ✓ Processing step has glow effect (shadow)

**Step Details:**
```
1. Social Media Audit
   - Status indicator animates while processing
   - Progress bar fills 0-100%
   - Completion shows green checkmark

2. Online Reputation
   - Similar pattern as above
   - This step fetches Trustpilot data

3. Brand Visibility
   - Step animation continues

4. Digital Consistency
   - Step animation continues

5. Generating Score
   - Final step before completion
   - Shows success message when done
```

---

### 3. **Test Dashboard Trustpilot Display**
**What to test:** Enhanced Trustpilot reviews card with new UI
**Steps:**
1. Navigate to `/dashboard` after completing an analysis
2. Scroll to find the Trustpilot Reviews section

**Expected visual improvements:**

#### If Trustpilot Data Available:
- ✓ Blue-cyan gradient header bar
- ✓ Large amber rating box (4.5/5 format)
- ✓ Star rating display (5 stars, filled)
- ✓ "Total Reviews" label with message icon
- ✓ "Excellent Rating" badge with thumbs-up
- ✓ Latest Reviews section shows top 3 reviews
- ✓ Each review shows:
  - Star rating
  - Review title
  - Review date with clock icon
  - Individual rating badge (4/5)
- ✓ Gradient background on review cards
- ✓ Hover effect on review cards (border changes, shadow appears)
- ✓ "View all reviews on Trustpilot" link at bottom

#### If Loading:
- ✓ Gradient header shows
- ✓ Skeleton loader animates with shimmer effect
- ✓ Gray placeholder blocks for rating, reviews

#### If No Data:
- ✓ Star icon in circle
- ✓ "No Trustpilot Data Available" message
- ✓ Helpful explanation text
- ✓ "Claim Your Profile" button linking to Trustpilot

---

### 4. **Test Skeleton Loaders**
**What to test:** Loading states show correct placeholders

**How to see them:**
1. Open browser DevTools (F12)
2. Go to Network tab
3. Set throttling to "Slow 3G"
4. Navigate to Dashboard or reload page
5. Observe skeleton loaders on Trustpilot cards

**Expected:**
- ✓ Shimmer animation effect (left-to-right gradient)
- ✓ Gray placeholder shapes matching final content dimensions
- ✓ No layout shift when real content loads
- ✓ Smooth fade transition from skeleton to real content

---

### 5. **Test Trustpilot API Integration**
**What to test:** ScrapAPI is correctly fetching Trustpilot data

**How to verify:**
1. Open browser DevTools Console (F12 > Console tab)
2. Look for logs during analysis:
   ```
   ✅ Trustpilot data fetched: {rating: 4.5, totalReviews: 150, ...}
   ```

3. Check if data appears on Dashboard after analysis completes

**Environment Variables:**
- Verify `SCRAPAPI_KEY` is set in your `.env` or deployment
- If not set, system shows "No Trustpilot data available" gracefully

**Testing API directly:**
```bash
# From project root
curl -X POST http://localhost:54321/functions/v1/fetch-trustpilot-reviews \
  -H "Content-Type: application/json" \
  -d '{"businessName": "Google"}'
```

---

### 6. **Test Responsive Design**
**What to test:** Loading screens work on all devices

**Steps:**
1. Open DevTools (F12)
2. Click device toggle (mobile icon)
3. Test different screen sizes:
   - Mobile (375px)
   - Tablet (768px)
   - Desktop (1920px)

**Expected:**
- ✓ Splash screen text is readable
- ✓ Progress bar is visible
- ✓ Step indicators stack properly
- ✓ Trustpilot card adapts to width
- ✓ No horizontal scrolling needed
- ✓ All buttons are tap-able (48px min height)

---

### 7. **Test Animations Performance**
**What to test:** Animations are smooth and not jittery

**Steps:**
1. Open DevTools > Performance tab
2. Click Record
3. Interact with the page (view analysis, load dashboard)
4. Stop recording
5. Check FPS (should be 60fps)

**Expected:**
- ✓ No dropped frames
- ✓ Animations smooth and consistent
- ✓ No memory leaks
- ✓ CPU usage reasonable

---

### 8. **Test Error Handling**
**What to test:** System handles missing data gracefully

**Scenarios:**

**Scenario A: ScrapAPI Key Missing**
1. Remove `SCRAPAPI_KEY` from environment
2. Run analysis
3. Trustpilot section should show "No data available" gracefully
4. No error messages or broken UI

**Scenario B: API Timeout**
1. Set slow network (DevTools Network > Slow 3G)
2. Run analysis
3. System should timeout gracefully after 30 seconds
4. Show fallback/loading state

**Scenario C: Invalid Business Name**
1. Enter a nonsense business name
2. Run analysis
3. Trustpilot section shows no data
4. Rest of analysis continues normally

---

### 9. **Test Loading Progression**
**What to test:** Progress percentage matches actual loading

**Steps:**
1. Start a new brand analysis
2. Watch the progress percentage at top
3. Compare with individual step progress

**Expected:**
- ✓ Overall progress increases smoothly
- ✓ Each step's progress bar fills
- ✓ Overall progress = average of all step progress
- ✓ No jumps or reversals in percentage
- ✓ Final "Generating Score" step takes meaningful time

---

### 10. **Test Completion Animations**
**What to test:** Completion state shows properly

**Steps:**
1. Wait for analysis to complete
2. Observe final state

**Expected:**
- ✓ All step circles turn green
- ✓ Checkmarks appear with scale animation
- ✓ Overall progress reaches 100%
- ✓ Success message appears
- ✓ "View Your Report" button appears
- ✓ Page auto-redirects to dashboard after 3 seconds (optional)

---

## Browser Compatibility

Test on:
- ✓ Chrome/Chromium (latest)
- ✓ Firefox (latest)
- ✓ Safari (latest)
- ✓ Edge (latest)
- ✓ Mobile Safari (iOS)
- ✓ Chrome Mobile (Android)

---

## Performance Checklist

- [ ] Page loads in < 3 seconds
- [ ] Analysis completes in 2-3 minutes
- [ ] Animations are smooth (60fps)
- [ ] No layout shift (skeleton loaders help)
- [ ] Images lazy-loaded
- [ ] CSS is minified
- [ ] JavaScript is minified
- [ ] Gzip compression enabled

---

## Troubleshooting

### Issue: Splash screen doesn't appear
**Solution:**
- Clear browser cache (Ctrl+Shift+Delete)
- Check console for errors
- Verify SplashScreen component is imported in App.tsx

### Issue: Progress bar doesn't move
**Solution:**
- Check browser console for JavaScript errors
- Verify Supabase connection
- Check if analysis is actually running (check backend logs)

### Issue: Trustpilot data not showing
**Solution:**
- Verify SCRAPAPI_KEY is set
- Check browser console for API errors
- Verify network tab shows fetch request
- Confirm Trustpilot page exists for business

### Issue: Skeleton loaders visible too long
**Solution:**
- Increase timeout duration if API is slow
- Reduce simulated progress delay
- Improve server response time

### Issue: Animations are laggy
**Solution:**
- Reduce animation complexity
- Disable animations in DevTools Settings > Rendering
- Check for heavy JavaScript in the same section
- Profile with Performance tab

---

## Automated Testing (Optional)

For team projects, consider adding:
```bash
# Run Cypress tests
npm run test:e2e

# Or with Jest for unit tests
npm run test:unit
```

---

## Success Criteria

✅ All tests pass
✅ No console errors
✅ Animations are smooth
✅ Data loads correctly
✅ No layout shifts
✅ Mobile responsive
✅ Cross-browser compatible
✅ Performance metrics good

---

**Last Updated:** 2024-10-24
**Status:** Ready for Testing
