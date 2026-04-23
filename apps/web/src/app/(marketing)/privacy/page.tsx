import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How FreightFlow collects, uses, and protects your personal data.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-4xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
      <p className="text-sm text-gray-500 mb-10">Last updated: April 23, 2026</p>

      <div className="prose prose-gray max-w-none space-y-8">

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Who We Are</h2>
          <p className="text-gray-600 leading-relaxed">
            FreightFlow (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) operates the FreightFlow platform — a transportation
            marketplace that connects shippers with independent carriers. Our registered address is
            123 Logistics Way, Chicago, IL 60601. For privacy-related enquiries, contact us at{' '}
            <a href="mailto:privacy@freightflow.com" className="text-blue-600 hover:underline">
              privacy@freightflow.com
            </a>.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Data We Collect</h2>
          <p className="text-gray-600 leading-relaxed mb-3">We collect the following categories of personal data:</p>
          <ul className="list-disc pl-6 space-y-2 text-gray-600">
            <li><strong>Account data:</strong> name, email address, phone number, role (shipper or driver).</li>
            <li><strong>Identity documents:</strong> government-issued ID, driver&apos;s licence, vehicle registration, insurance certificates — collected from drivers and, optionally, shippers for verification purposes.</li>
            <li><strong>Shipment data:</strong> pickup/delivery addresses, cargo descriptions, transaction amounts.</li>
            <li><strong>Communications:</strong> messages sent through the in-platform chat.</li>
            <li><strong>Usage data:</strong> IP address, browser/device info, pages visited, collected automatically via server logs.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">3. How We Use Your Data</h2>
          <ul className="list-disc pl-6 space-y-2 text-gray-600">
            <li>To provide and operate the FreightFlow marketplace.</li>
            <li>To verify the identity and credentials of drivers before they can place bids.</li>
            <li>To process and track shipments, bids, and bookings.</li>
            <li>To send transactional notifications (booking confirmations, status updates).</li>
            <li>To detect and prevent fraud, abuse, and security incidents.</li>
            <li>To comply with applicable law, including tax and regulatory obligations.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Legal Basis for Processing (GDPR)</h2>
          <p className="text-gray-600 leading-relaxed">
            Where GDPR applies, we process your data on the following legal bases: (a) contract performance — processing
            necessary to provide the service you have signed up for; (b) legitimate interests — fraud prevention, platform
            security, and improving our service; (c) legal obligation — compliance with applicable laws; and (d) consent —
            where you have provided explicit consent, which you may withdraw at any time.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Data Sharing</h2>
          <p className="text-gray-600 leading-relaxed mb-3">
            We do not sell your personal data. We share data only as follows:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-600">
            <li><strong>Between users:</strong> Shippers see driver names, ratings, and bid amounts. Drivers see shipper names and shipment details.</li>
            <li><strong>Service providers:</strong> Cloud hosting (Railway, Vercel), email delivery, and file storage providers, each bound by data processing agreements.</li>
            <li><strong>Legal requirements:</strong> When required by law, court order, or governmental authority.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Document Storage & Security</h2>
          <p className="text-gray-600 leading-relaxed">
            Identity documents you upload are stored securely and accessed only by authorised FreightFlow administrators
            for verification purposes. We use industry-standard encryption in transit (TLS) and at rest. Documents
            are deleted when you close your account or upon request.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Data Retention</h2>
          <p className="text-gray-600 leading-relaxed">
            We retain your account data for as long as your account is active. After account deletion, we retain
            transaction records for 7 years for tax and regulatory purposes. Identity verification documents are
            deleted within 90 days of account closure. Audit logs are retained for 2 years.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Your Rights</h2>
          <p className="text-gray-600 leading-relaxed mb-3">
            Depending on your location, you may have the right to:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-600">
            <li>Access a copy of the personal data we hold about you.</li>
            <li>Correct inaccurate or incomplete data.</li>
            <li>Request deletion of your data (&quot;right to be forgotten&quot;), subject to legal retention requirements.</li>
            <li>Object to or restrict certain processing activities.</li>
            <li>Data portability — receive your data in a machine-readable format.</li>
            <li>Withdraw consent at any time where processing is based on consent.</li>
          </ul>
          <p className="text-gray-600 leading-relaxed mt-3">
            To exercise any of these rights, email{' '}
            <a href="mailto:privacy@freightflow.com" className="text-blue-600 hover:underline">
              privacy@freightflow.com
            </a>. We will respond within 30 days.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Cookies</h2>
          <p className="text-gray-600 leading-relaxed">
            We use only strictly necessary session cookies for authentication. We do not use tracking or advertising
            cookies. No consent banner is required for strictly necessary cookies under ePrivacy regulations.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Changes to This Policy</h2>
          <p className="text-gray-600 leading-relaxed">
            We may update this policy from time to time. Material changes will be notified by email or prominent
            notice in the platform at least 14 days before they take effect.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Contact</h2>
          <p className="text-gray-600 leading-relaxed">
            For questions or complaints about how we handle your data, contact our Data Protection contact at{' '}
            <a href="mailto:privacy@freightflow.com" className="text-blue-600 hover:underline">
              privacy@freightflow.com
            </a>. You also have the right to lodge a complaint with your local data protection authority.
          </p>
        </section>

      </div>
    </div>
  );
}
