import React from 'react';
import PageShell from '../components/PageShell';

export default function Docs() {
  return (
    <PageShell title="Docs" subtitle="Quick start and usage notes.">
      <div className="space-y-6 text-gray-700">
        <section>
          <h3 className="text-xl font-bold text-gray-900 mb-2">1) Configure</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Create your frontend env (see <code className="px-1 bg-black/5 rounded">frontend/.env.example</code>).</li>
            <li>Start backend and set API base URL if needed.</li>
          </ul>
        </section>

        <section>
          <h3 className="text-xl font-bold text-gray-900 mb-2">2) Run a Single Analysis</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Enter a company name or description.</li>
            <li>Optionally provide industry and website.</li>
            <li>Generate audit + email and export PDF.</li>
            <li>No login is required for demo use on the Home page.</li>
          </ul>
        </section>

        <section>
          <h3 className="text-xl font-bold text-gray-900 mb-2">3) Storage</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Login and register data is stored in browser </li>
            <li>Clear site data to remove stored accounts/session.</li>
          </ul>
        </section>
      </div>
    </PageShell>
  );
}
