import { MarketingFooter } from '@/components/marketing/footer';
import { MarketingNavbar } from '@/components/marketing/navbar';

export const metadata = { title: 'Grievance Officer — Bharat Leads' };

export default function GrievancePage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <MarketingNavbar />
      <main className="flex-1 py-16">
        <article className="container max-w-2xl prose prose-slate dark:prose-invert">
          <h1>Grievance Officer</h1>
          <p>
            In accordance with the DPDP Act 2023 and Information Technology (Intermediary Guidelines and
            Digital Media Ethics Code) Rules, 2021, Bharat Leads designates the following Grievance Officer:
          </p>
          <ul>
            <li><strong>Designation:</strong> Grievance Officer & DPO</li>
            <li><strong>Email:</strong> grievance@bharatleads.in</li>
            <li><strong>Postal:</strong> Bharat Leads, Bengaluru, Karnataka 560001, India</li>
            <li><strong>Hours:</strong> Mon–Fri 10:00–18:00 IST</li>
            <li><strong>Response SLA:</strong> Acknowledgement within 48h, resolution within 7 working days</li>
          </ul>
          <h2>Escalation</h2>
          <p>
            If you are not satisfied with our resolution, you may file a complaint with the Data Protection
            Board of India once it is operational. Alternatively, in the interim, you may approach a competent
            court or consumer forum in Bengaluru.
          </p>
        </article>
      </main>
      <MarketingFooter />
    </div>
  );
}
