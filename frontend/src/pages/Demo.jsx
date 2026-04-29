import React from 'react';
import PageShell from '../components/PageShell';

export default function Demo() {
  return (
    <PageShell title="Watch Demo" subtitle="A short walkthrough of the workflow.">
      <div className="space-y-6">
        <div className="rounded-2xl overflow-hidden border border-white/40 bg-black/5">
          <div className="aspect-video w-full">
            <video className="w-full h-full" controls>
              <source src="/demo.mp4" type="video/mp4" />
            </video>
          </div>
        </div>
        <p className="text-gray-600">
          Put your file at <code className="px-1 bg-black/5 rounded">frontend/public/demo.mp4</code> to update the demo video.
        </p>
      </div>
    </PageShell>
  );
}
