import { useState } from 'react';
import { Facebook, Instagram, Twitter, Youtube, Linkedin, Mail, Phone, MapPin, Clock, ChevronDown, ChevronUp } from 'lucide-react';

const Footer = () => {
  const [openSections, setOpenSections] = useState({
    about: false,
    quickLinks: false,
    contact: false,
    social: false,
  });

  const toggleSection = (section) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <footer 
      className="bg-gray-800 text-gray-300 mt-auto"
      style={{
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        transform: 'translateZ(0)',
        WebkitTransform: 'translateZ(0)',
        willChange: 'transform'
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
        {/* Main Footer Sections - Accordion on Mobile, Grid on Desktop */}
        <div className="space-y-0 md:space-y-0">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-0 md:gap-6 lg:gap-8">
            {/* About Section */}
            <div className="border-b md:border-b-0 border-gray-700 md:border-none">
              <button
                onClick={() => toggleSection('about')}
                className="md:pointer-events-none w-full md:w-auto flex items-center justify-between md:justify-start py-4 md:py-0 md:mb-4 text-white font-semibold text-base md:text-lg"
              >
                <span>Get to know us</span>
                <ChevronDown
                  size={20}
                  className={`md:hidden transition-transform ${
                    openSections.about ? 'rotate-180' : ''
                  }`}
                />
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  openSections.about ? 'max-h-96' : 'max-h-0'
                } md:max-h-none`}
                style={{
                  willChange: 'max-height',
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden'
                }}
              >
                <div className="pb-4 md:pb-0">
                  <p className="text-sm leading-relaxed text-gray-400 mb-4 md:mb-0">
                    MAHAFPC is a state level farmer producer company which is consortium of farmer producer companies registered under the Company Act 1956.
                  </p>
                  <ul className="space-y-2 text-sm md:hidden">
                    <li>
                      <a href="#" className="hover:text-white transition-colors block py-1">
                        About MAHAFPC
                      </a>
                    </li>
                    <li>
                      <a href="#" className="hover:text-white transition-colors block py-1">
                        Careers
                      </a>
                    </li>
                    <li>
                      <a href="#" className="hover:text-white transition-colors block py-1">
                        Press Releases
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="border-b md:border-b-0 border-gray-700 md:border-none">
              <button
                onClick={() => toggleSection('quickLinks')}
                className="md:pointer-events-none w-full md:w-auto flex items-center justify-between md:justify-start py-4 md:py-0 md:mb-4 text-white font-semibold text-base md:text-lg"
              >
                <span>Connect with us</span>
                <ChevronDown
                  size={20}
                  className={`md:hidden transition-transform ${
                    openSections.quickLinks ? 'rotate-180' : ''
                  }`}
                />
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  openSections.quickLinks ? 'max-h-96' : 'max-h-0'
                } md:max-h-none`}
                style={{
                  willChange: 'max-height',
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden'
                }}
              >
                <div className="pb-4 md:pb-0">
                  <ul className="space-y-2 text-sm">
                    <li>
                      <a href="#" className="hover:text-white transition-colors block py-1">
                        Home
                      </a>
                    </li>
                    <li>
                      <a href="#" className="hover:text-white transition-colors block py-1">
                        About Us
                      </a>
                    </li>
                    <li>
                      <a href="#" className="hover:text-white transition-colors block py-1">
                        Services
                      </a>
                    </li>
                    <li>
                      <a href="#" className="hover:text-white transition-colors block py-1">
                        Procurement
                      </a>
                    </li>
                    <li>
                      <a href="#" className="hover:text-white transition-colors block py-1">
                        Tenders
                      </a>
                    </li>
                    <li>
                      <a href="#" className="hover:text-white transition-colors block py-1">
                        Contact Us
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="border-b md:border-b-0 border-gray-700 md:border-none">
              <button
                onClick={() => toggleSection('contact')}
                className="md:pointer-events-none w-full md:w-auto flex items-center justify-between md:justify-start py-4 md:py-0 md:mb-4 text-white font-semibold text-base md:text-lg"
              >
                <span>Make money with us</span>
                <ChevronDown
                  size={20}
                  className={`md:hidden transition-transform ${
                    openSections.contact ? 'rotate-180' : ''
                  }`}
                />
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  openSections.contact ? 'max-h-96' : 'max-h-0'
                } md:max-h-none`}
                style={{
                  willChange: 'max-height',
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden'
                }}
              >
                <div className="pb-4 md:pb-0">
                  <ul className="space-y-2 text-sm">
                    <li>
                      <a href="#" className="hover:text-white transition-colors block py-1">
                        Sell on MAHAFPC
                      </a>
                    </li>
                    <li>
                      <a href="#" className="hover:text-white transition-colors block py-1">
                        Supply to MAHAFPC
                      </a>
                    </li>
                    <li>
                      <a href="#" className="hover:text-white transition-colors block py-1">
                        Become a Partner
                      </a>
                    </li>
                    <li>
                      <a href="#" className="hover:text-white transition-colors block py-1">
                        Advertise Your Products
                      </a>
                    </li>
                    <li>
                      <a href="#" className="hover:text-white transition-colors block py-1">
                        Protect and build your brand
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Social Media / Help Section */}
            <div className="border-b md:border-b-0 border-gray-700 md:border-none">
              <button
                onClick={() => toggleSection('social')}
                className="md:pointer-events-none w-full md:w-auto flex items-center justify-between md:justify-start py-4 md:py-0 md:mb-4 text-white font-semibold text-base md:text-lg"
              >
                <span>Let us help you</span>
                <ChevronDown
                  size={20}
                  className={`md:hidden transition-transform ${
                    openSections.social ? 'rotate-180' : ''
                  }`}
                />
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  openSections.social ? 'max-h-96' : 'max-h-0'
                } md:max-h-none`}
                style={{
                  willChange: 'max-height',
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden'
                }}
              >
                <div className="pb-4 md:pb-0">
                  <ul className="space-y-3 text-sm mb-4 md:mb-0">
                    <li className="flex items-start gap-3">
                      <Phone size={16} className="mt-1 text-green-400 flex-shrink-0" />
                      <a href="tel:+912024272827" className="hover:text-white transition-colors">
                        +(91) 20 2427 2827
                      </a>
                    </li>
                    <li className="flex items-start gap-3">
                      <Mail size={16} className="mt-1 text-green-400 flex-shrink-0" />
                      <a href="mailto:mahafpc@mahafpc.org" className="hover:text-white transition-colors">
                        mahafpc@mahafpc.org
                      </a>
                    </li>
                    <li className="flex items-start gap-3">
                      <MapPin size={16} className="mt-1 text-green-400 flex-shrink-0" />
                      <span>622, Market Yard, Pune-37</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Clock size={16} className="mt-1 text-green-400 flex-shrink-0" />
                      <span>Opens at 10AM to 06PM</span>
                    </li>
                  </ul>
                  {/* Social Media Icons - Hidden on mobile, shown on desktop */}
                  <div className="hidden md:flex gap-4 mt-4">
                    <a
                      href="https://www.facebook.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center hover:bg-green-600 transition-colors"
                      aria-label="Facebook"
                    >
                      <Facebook size={18} />
                    </a>
                    <a
                      href="https://www.instagram.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center hover:bg-green-600 transition-colors"
                      aria-label="Instagram"
                    >
                      <Instagram size={18} />
                    </a>
                    <a
                      href="https://www.twitter.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center hover:bg-green-600 transition-colors"
                      aria-label="Twitter"
                    >
                      <Twitter size={18} />
                    </a>
                    <a
                      href="https://www.youtube.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center hover:bg-green-600 transition-colors"
                      aria-label="YouTube"
                    >
                      <Youtube size={18} />
                    </a>
                    <a
                      href="https://www.linkedin.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center hover:bg-green-600 transition-colors"
                      aria-label="LinkedIn"
                    >
                      <Linkedin size={18} />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Social Media Section - Mobile Only */}
        <div className="md:hidden border-t border-gray-700 pt-6 mt-4">
          <h3 className="text-white font-semibold text-base mb-4">Follow Us</h3>
          <div className="flex gap-4">
            <a
              href="https://www.facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center hover:bg-green-600 transition-colors"
              aria-label="Facebook"
            >
              <Facebook size={18} />
            </a>
            <a
              href="https://www.instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center hover:bg-green-600 transition-colors"
              aria-label="Instagram"
            >
              <Instagram size={18} />
            </a>
            <a
              href="https://www.twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center hover:bg-green-600 transition-colors"
              aria-label="Twitter"
            >
              <Twitter size={18} />
            </a>
            <a
              href="https://www.youtube.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center hover:bg-green-600 transition-colors"
              aria-label="YouTube"
            >
              <Youtube size={18} />
            </a>
            <a
              href="https://www.linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center hover:bg-green-600 transition-colors"
              aria-label="LinkedIn"
            >
              <Linkedin size={18} />
            </a>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-700 mt-6 sm:mt-8 pt-6 sm:pt-8">
          <div className="flex flex-col gap-4">
            {/* Copyright */}
            <p className="text-xs sm:text-sm text-gray-400 text-center md:text-left">
              © Maha FPC {new Date().getFullYear()}. Designed & Developed by orelse technologies pvt ltd
            </p>
            {/* Legal Links */}
            <div className="flex flex-wrap justify-center md:justify-start gap-4 sm:gap-6 text-xs sm:text-sm">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Disclaimer</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

