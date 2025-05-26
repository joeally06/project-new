import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin } from 'lucide-react';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-secondary text-white">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-1 lg:col-span-1">
            <div className="flex flex-col h-full">
              <h2 className="text-xl font-bold text-white mb-4">TAPT</h2>
              <p className="text-gray-300 mb-4">Tennessee Association of Pupil Transportation</p>
              <p className="text-gray-300 mb-6">Promoting safe and efficient student transportation across Tennessee since 1977.</p>
              <div className="flex space-x-4 mt-auto">
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white">
                  <Facebook size={20} />
                </a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white">
                  <Twitter size={20} />
                </a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white">
                  <Instagram size={20} />
                </a>
              </div>
            </div>
          </div>

          <div className="col-span-1 md:col-span-1 lg:col-span-1">
            <h3 className="text-lg font-bold text-white mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link to="/" className="text-gray-300 hover:text-white transition-colors">Home</Link></li>
              <li><Link to="/about" className="text-gray-300 hover:text-white transition-colors">About Us</Link></li>
              <li><Link to="/resources" className="text-gray-300 hover:text-white transition-colors">Resources</Link></li>
              <li><Link to="/news" className="text-gray-300 hover:text-white transition-colors">News</Link></li>
              <li><Link to="/events" className="text-gray-300 hover:text-white transition-colors">Events</Link></li>
              <li><Link to="/members" className="text-gray-300 hover:text-white transition-colors">Membership</Link></li>
              <li><Link to="/contact" className="text-gray-300 hover:text-white transition-colors">Contact Us</Link></li>
            </ul>
          </div>

          <div className="col-span-1 md:col-span-1 lg:col-span-1">
            <h3 className="text-lg font-bold text-white mb-4">Resources</h3>
            <ul className="space-y-2">
              <li><Link to="/resources" className="text-gray-300 hover:text-white transition-colors">Training Materials</Link></li>
              <li><Link to="/resources" className="text-gray-300 hover:text-white transition-colors">Safety Guidelines</Link></li>
              <li><Link to="/resources" className="text-gray-300 hover:text-white transition-colors">State Regulations</Link></li>
              <li><Link to="/resources" className="text-gray-300 hover:text-white transition-colors">Best Practices</Link></li>
              <li><Link to="/resources" className="text-gray-300 hover:text-white transition-colors">Forms & Documents</Link></li>
              <li><Link to="/resources" className="text-gray-300 hover:text-white transition-colors">FAQ</Link></li>
            </ul>
          </div>

          <div className="col-span-1 md:col-span-1 lg:col-span-1">
            <h3 className="text-lg font-bold text-white mb-4">Contact Us</h3>
            <address className="not-italic">
              <div className="flex items-start mb-3">
                <MapPin size={20} className="mr-2 mt-1 flex-shrink-0" />
                <span className="text-gray-300">P.O. Box 700<br />Portland, TN 37148</span>
              </div>
              <div className="flex items-center mb-3">
                <Phone size={20} className="mr-2 flex-shrink-0" />
                <a href="tel:+16154069199" className="text-gray-300 hover:text-white">615-406-9199</a>
              </div>
              <div className="flex items-center">
                <Mail size={20} className="mr-2 flex-shrink-0" />
                <a href="mailto:contact@tapt.org" className="text-gray-300 hover:text-white">contact@tapt.org</a>
              </div>
            </address>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-10 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-300 text-sm">&copy; {currentYear} Tennessee Association of Pupil Transportation. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link to="/privacy-policy" className="text-gray-300 text-sm hover:text-white">Privacy Policy</Link>
              <Link to="/terms-of-service" className="text-gray-300 text-sm hover:text-white">Terms of Service</Link>
              <Link to="/accessibility" className="text-gray-300 text-sm hover:text-white">Accessibility</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};