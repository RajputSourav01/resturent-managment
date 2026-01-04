export default function Footer() {
  return (
    <footer className="bg-black text-gray-400 py-8 sm:py-10 lg:py-12 mt-auto w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          <div className="text-center sm:text-left">
            <h3 className="text-white font-bold text-lg mb-2">Golden Fork</h3>
            <p className="text-sm leading-relaxed">
              Smart restaurant automation for the digital era.
            </p>
          </div>

          <div className="text-center sm:text-left">
            <h4 className="text-white font-semibold text-base mb-3">Features</h4>
            <ul className="space-y-1 text-sm">
              <li>QR Menu & Ordering</li>
              <li>Admin Panel</li>
              <li>Kitchen Live Orders</li>
              <li>Staff Management</li>
              <li>Billing & Reports</li>
            </ul>
          </div>

          <div className="text-center sm:text-left sm:col-span-2 lg:col-span-1">
            <h4 className="text-white font-semibold text-base mb-3">Company</h4>
            <ul className="space-y-1 text-sm">
              <li>
                 <a className="text-purple-400" href="/about">About us</a>
              </li>
              <li>
                 <a className="text-purple-400" href="/contact">Contact</a>
              </li>
              <li>Privacy Policy</li>
              <li>Terms & Conditions</li>
            </ul>
          </div>
        </div>

        <div className="text-center text-sm mt-8 pt-6 border-t border-gray-700">
          © {new Date().getFullYear()} Golden Fork. All rights reserved.
        </div>
        <div className="text-center text-sm  pt-2 border-gray-700">
          © <i>Designed by<a href="https://www.linkedin.com/in/sourav-kumar-49082636b?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app" target="_blank"> SOURAV KUMAR</a>.</i>
        </div>
      </div>
    </footer>
  );
}