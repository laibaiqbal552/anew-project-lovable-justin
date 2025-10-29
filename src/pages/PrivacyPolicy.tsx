import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Link to="/">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>

        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString()}</p>

        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              TopServ Digital ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Brand Equity Analyzer service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
            
            <h3 className="text-xl font-semibold mb-3 mt-4">2.1 Personal Information</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We may collect personal information that you voluntarily provide to us when you:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Register for an account</li>
              <li>Express interest in obtaining information about us or our services</li>
              <li>Participate in activities on the Service</li>
              <li>Contact us</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              This information may include: name, email address, business name, website URL, and other contact information.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">2.2 Automatically Collected Information</h3>
            <p className="text-muted-foreground leading-relaxed">
              When you access the Service, we automatically collect certain information about your device, including information about your web browser, IP address, time zone, and some of the cookies that are installed on your device. Additionally, as you browse the Service, we collect information about the individual web pages that you view, what websites or search terms referred you to the Service, and information about how you interact with the Service.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">2.3 Business Data</h3>
            <p className="text-muted-foreground leading-relaxed">
              When you request a brand analysis, we collect and analyze publicly available information about the business or brand you specify, including social media presence, website metrics, reviews, and other digital footprint data.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We use the information we collect or receive:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>To provide, operate, and maintain our Service</li>
              <li>To improve, personalize, and expand our Service</li>
              <li>To understand and analyze how you use our Service</li>
              <li>To develop new products, services, features, and functionality</li>
              <li>To communicate with you, either directly or through one of our partners</li>
              <li>To send you updates and marketing communications</li>
              <li>To process your transactions</li>
              <li>To find and prevent fraud</li>
              <li>To comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Sharing Your Information</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We may share your information in the following situations:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li><strong>With Service Providers:</strong> We may share your information with third-party vendors, service providers, contractors, or agents who perform services for us or on our behalf.</li>
              <li><strong>For Business Transfers:</strong> We may share or transfer your information in connection with, or during negotiations of, any merger, sale of company assets, financing, or acquisition of all or a portion of our business to another company.</li>
              <li><strong>With Your Consent:</strong> We may disclose your personal information for any other purpose with your consent.</li>
              <li><strong>For Legal Purposes:</strong> We may disclose your information where we are legally required to do so in order to comply with applicable law, governmental requests, a judicial proceeding, court order, or legal process.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Data Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              We have implemented appropriate technical and organizational security measures designed to protect the security of any personal information we process. However, please note that no electronic transmission over the Internet or information storage technology can be guaranteed to be 100% secure, so we cannot promise or guarantee that hackers, cybercriminals, or other unauthorized third parties will not be able to defeat our security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Data Retention</h2>
            <p className="text-muted-foreground leading-relaxed">
              We will only keep your personal information for as long as it is necessary for the purposes set out in this Privacy Policy, unless a longer retention period is required or permitted by law. When we have no ongoing legitimate business need to process your personal information, we will either delete or anonymize it.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Your Privacy Rights</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Depending on your location, you may have the following rights regarding your personal information:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>The right to access – You have the right to request copies of your personal data</li>
              <li>The right to rectification – You have the right to request that we correct any information you believe is inaccurate</li>
              <li>The right to erasure – You have the right to request that we erase your personal data, under certain conditions</li>
              <li>The right to restrict processing – You have the right to request that we restrict the processing of your personal data, under certain conditions</li>
              <li>The right to object to processing – You have the right to object to our processing of your personal data, under certain conditions</li>
              <li>The right to data portability – You have the right to request that we transfer the data that we have collected to another organization, or directly to you, under certain conditions</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Cookies and Tracking</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use cookies and similar tracking technologies to track activity on our Service and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Third-Party Services</h2>
            <p className="text-muted-foreground leading-relaxed">
              Our Service may contain links to third-party websites or services that are not owned or controlled by us. We have no control over, and assume no responsibility for, the content, privacy policies, or practices of any third-party websites or services. We strongly advise you to review the Privacy Policy of every site you visit.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Children's Privacy</h2>
            <p className="text-muted-foreground leading-relaxed">
              Our Service does not address anyone under the age of 13. We do not knowingly collect personally identifiable information from anyone under the age of 13. If you are a parent or guardian and you are aware that your child has provided us with personal information, please contact us.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">11. Changes to This Privacy Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. You are advised to review this Privacy Policy periodically for any changes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">12. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have any questions about this Privacy Policy, please contact us at:
            </p>
            <p className="text-muted-foreground leading-relaxed mt-2">
              Email: privacy@topservdigital.com
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
