import { X } from "lucide-react";

interface LegalModalProps {
  isOpen: boolean;
  type: "terms" | "privacy" | null;
  onClose: () => void;
}

export default function LegalModals({ isOpen, type, onClose }: LegalModalProps) {
  if (!isOpen || !type) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-2xl bg-white border-4 border-black rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b-4 border-black bg-slate-50">
          <h3 className="text-xl font-black uppercase tracking-tight">
            {type === "terms" ? "📜 Terms and Conditions" : "🔒 Privacy Policy"}
          </h3>
          <button 
            onClick={onClose}
            className="p-1.5 bg-red-100 hover:bg-red-200 border-2 border-black text-red-800 rounded-lg cursor-pointer transition-all active:translate-y-0.5"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-sm text-slate-700 font-medium leading-relaxed">
          {type === "terms" ? (
            <>
              <p className="text-xs text-slate-400 font-mono">Last Updated: July 5, 2026</p>
              
              <h4 className="font-black text-slate-900 uppercase">1. Acceptance of Terms</h4>
              <p>
                By accessing and using this Interactive 3D Greeting Card Generator ("Service"), you agree to be bound by these Terms and Conditions. If you do not agree to all of these terms, please do not use the Service.
              </p>

              <h4 className="font-black text-slate-900 uppercase">2. Use License</h4>
              <p>
                Permission is granted to temporarily use this platform for personal, non-commercial transitory viewing and creation of interactive birthday greetings. Under this license you may not:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Modify or copy any underlying code or proprietary 3D materials.</li>
                <li>Use the materials for any commercial purpose or public display.</li>
                <li>Attempt to decompile, reverse engineer, or extract assets from the 3D rendering engine.</li>
                <li>Use the platform to host, generate, or transmit offensive, harassing, defamatory, or unlawful content.</li>
              </ul>

              <h4 className="font-black text-slate-900 uppercase">3. Custom Media & User Content</h4>
              <p>
                You retain all rights to any text message, title, names, or custom images you configure in the Service. You represent and warrant that you have all necessary rights to upload or reference any uploaded photo and that doing so does not infringe any third party intellectual property rights.
              </p>

              <h4 className="font-black text-slate-900 uppercase">4. Disclaimer of Warranties</h4>
              <p>
                The Service is provided on an "as is" and "as available" basis. We make no warranties, expressed or implied, and hereby disclaim all other warranties including, without limitation, implied warranties of merchantability, fitness for a particular purpose, or non-infringement of intellectual property.
              </p>
              <p>
                Furthermore, we do not warrant that the Service (including 3D rendering, canvas elements, and Web Audio synthesizers) will be uninterrupted, error-free, or compatible with every mobile device or web browser.
              </p>

              <h4 className="font-black text-slate-900 uppercase">5. Limitations of Liability</h4>
              <p>
                In no event shall the developers, contributors, or hosts of this Service be liable for any damages (including, without limitation, damages for loss of data, loss of goodwill, or business interruption) arising out of the use or inability to use the materials on the Service, even if notified orally or in writing of the possibility of such damage.
              </p>

              <h4 className="font-black text-slate-900 uppercase">6. Service Amendments & Revisions</h4>
              <p>
                We reserve the right to revise, update, or discontinue any feature, tool, asset style, or design preset of the Service at any time without prior notice.
              </p>
            </>
          ) : (
            <>
              <p className="text-xs text-slate-400 font-mono">Last Updated: July 5, 2026</p>
              
              <h4 className="font-black text-slate-900 uppercase">1. Zero Server-Side Storage Policy</h4>
              <p>
                Your privacy is our absolute priority. The Service operates on a completely decentralized, zero-database architecture. 
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>We do NOT store your name, recipient names, dates of birth, custom wishes, or custom images on any central database or server.</li>
                <li>All configurations are saved strictly inside your own browser's <strong>Local Storage</strong> or encoded into highly portable, secure URL query parameters when sharing.</li>
                <li>When a recipient opens a shared link, the entire birthday card experience is decoded directly on their device, completely client-side.</li>
              </ul>

              <h4 className="font-black text-slate-900 uppercase">2. Browser Storage & Local Storage</h4>
              <p>
                We use standard Web Local Storage (localStorage) solely to store your saved lists of upcoming birthdays and custom designs. This keeps your entries active between browser sessions without needing an account. You can clear this data at any time by clearing your browser cache or clicking "Delete" inside the dashboard.
              </p>

              <h4 className="font-black text-slate-900 uppercase">3. Custom Photo Uploads</h4>
              <p>
                When you upload a custom photo to frame onto the birthday card, it is parsed as a local base64 data string. It never travels to any remote server and is stored purely inside your browser's local state or direct configuration URL.
              </p>

              <h4 className="font-black text-slate-900 uppercase">4. Cookie Information</h4>
              <p>
                This Service does not use tracking cookies, targeting cookies, or third-party advertising tracking technologies. We believe in a clean, tracking-free web experience.
              </p>

              <h4 className="font-black text-slate-900 uppercase">5. Web Audio and 3D Canvas Security</h4>
              <p>
                Our 3D rendering canvas (Three.js) and ambient melody synthesizer (Web Audio API) run strictly on your physical machine. No audio stream, mouse movement telemetry, or spatial rotation coordinate data is gathered or shared.
              </p>

              <h4 className="font-black text-slate-900 uppercase">6. Contact Information</h4>
              <p>
                If you have any questions regarding this Privacy Policy or how your local browser data is handled, please feel free to clear your browser's local storage or reach out via our GitHub repository workspace.
              </p>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t-4 border-black bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-yellow-300 hover:bg-yellow-400 border-2 border-black text-slate-900 font-black uppercase text-xs rounded-xl shadow-[2px_2px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-0.5 transition-all cursor-pointer"
          >
            I Understand & Accept
          </button>
        </div>
      </div>
    </div>
  );
}
