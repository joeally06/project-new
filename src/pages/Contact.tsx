import React, { useEffect, useState } from 'react';
import { Mail, Phone, MapPin, Send, AlertCircle } from 'lucide-react';

export const Contact: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [formState, setFormState] = useState({
    name: '',
    email: '',
    phone: '',
    district: '',
    message: '',
    submitted: false,
    error: false,
    loading: false
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormState(prev => ({ ...prev, loading: true }));

    // Simulate form submission
    setTimeout(() => {
      if (Math.random() > 0.1) { // 90% success rate for demo
        setFormState(prev => ({
          ...prev,
          submitted: true,
          error: false,
          loading: false
        }));
      } else {
        setFormState(prev => ({
          ...prev,
          submitted: false,
          error: true,
          loading: false
        }));
      }
    }, 1500);
  };

  return (
    <div className="pt-16">
      {/* Hero Section */}
      <section className="bg-secondary text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-24">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 fade-in">Contact Us</h1>
            <p className="text-xl text-gray-200 mb-8 fade-in">Get in touch with the Tennessee Association of Pupil Transportation. We're here to help.</p>
          </div>
        </div>
      </section>

      {/* Contact Information & Form */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Contact Information */}
            <div>
              <h2 className="text-2xl font-bold text-secondary mb-6">Connect With Us</h2>
              
              <div className="space-y-8">
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-primary/10 p-3 rounded-full">
                    <MapPin className="h-6 w-6 text-primary" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-secondary">Mailing Address</h3>
                    <address className="mt-1 not-italic text-gray-600">
                      Tennessee Association of Pupil Transportation<br />
                      P.O. Box 700<br />
                      Portland, TN 37148
                    </address>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-primary/10 p-3 rounded-full">
                    <Phone className="h-6 w-6 text-primary" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-secondary">Phone</h3>
                    <p className="mt-1 text-gray-600">
                      <a href="tel:+16154069199" className="hover:text-primary transition-colors">615-406-9199</a>
                    </p>
                    <p className="mt-1 text-gray-500 text-sm">
                      Monday – Friday, 8:00 AM – 4:30 PM CST
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-primary/10 p-3 rounded-full">
                    <Mail className="h-6 w-6 text-primary" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-secondary">Email</h3>
                    <p className="mt-1 text-gray-600">
                      <a href="mailto:contact@tapt.org" className="hover:text-primary transition-colors">contact@tapt.org</a>
                    </p>
                    <p className="mt-1 text-gray-500 text-sm">
                      We'll respond as quickly as possible
                    </p>
                  </div>
                </div>
              </div>

              {/* Map or additional content */}
              <div className="mt-12 bg-gray-200 rounded-lg overflow-hidden h-64">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d205412.91768841974!2d-86.91399624871484!3d36.23991499510724!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x88644ec5cae45573%3A0xf649d19eb1a80ecb!2sPortland%2C%20TN!5e0!3m2!1sen!2sus!4v1667579591619!5m2!1sen!2sus"
                  style={{ border: 0 }}
                  allowFullScreen={false}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="w-full h-full"
                ></iframe>
              </div>
            </div>

            {/* Contact Form */}
            <div>
              <h2 className="text-2xl font-bold text-secondary mb-6">Send Us a Message</h2>
              
              {formState.submitted ? (
                <div className="bg-green-50 border-l-4 border-green-500 p-6 rounded-md">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-medium text-green-800">Message Sent!</h3>
                      <div className="mt-2 text-green-700">
                        <p>Thank you for contacting TAPT. We've received your message and will respond shortly.</p>
                      </div>
                      <div className="mt-4">
                        <button
                          type="button"
                          onClick={() => setFormState({
                            name: '',
                            email: '',
                            phone: '',
                            district: '',
                            message: '',
                            submitted: false,
                            error: false,
                            loading: false
                          })}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm leading-5 font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:border-green-300 focus:shadow-outline-green active:bg-green-300 transition ease-in-out duration-150"
                        >
                          Send Another Message
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {formState.error && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <AlertCircle className="h-5 w-5 text-red-400" />
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-red-800">There was an error sending your message</h3>
                          <p className="mt-1 text-sm text-red-700">Please try again or contact us directly by phone.</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Name Field */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formState.name}
                      onChange={handleChange}
                      required
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                    />
                  </div>

                  {/* Email Field */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formState.email}
                      onChange={handleChange}
                      required
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                    />
                  </div>

                  {/* Phone Field */}
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone Number</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formState.phone}
                      onChange={handleChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                    />
                  </div>

                  {/* School District Field */}
                  <div>
                    <label htmlFor="district" className="block text-sm font-medium text-gray-700">School District/Organization</label>
                    <input
                      type="text"
                      id="district"
                      name="district"
                      value={formState.district}
                      onChange={handleChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                    />
                  </div>

                  {/* Message Field */}
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700">Message</label>
                    <textarea
                      id="message"
                      name="message"
                      value={formState.message}
                      onChange={handleChange}
                      required
                      rows={4}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                    ></textarea>
                  </div>

                  {/* Submit Button */}
                  <div>
                    <button
                      type="submit"
                      disabled={formState.loading}
                      className="w-full inline-flex justify-center items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-70"
                    >
                      {formState.loading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-5 w-5" />
                          Send Message
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-secondary mb-2">Frequently Asked Questions</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Find quick answers to common questions about TAPT and our services.
            </p>
          </div>
          
          <div className="max-w-3xl mx-auto">
            <dl className="space-y-6">
              {[
                {
                  question: "How do I become a TAPT member?",
                  answer: "You can become a TAPT member by visiting our Membership page and completing the application form. Annual memberships are available for individuals and organizations."
                },
                {
                  question: "When and where is the next TAPT conference?",
                  answer: "Our annual conference is typically held in June. Details for the upcoming conference can be found on our Events page or by contacting the TAPT office."
                },
                {
                  question: "Does TAPT offer training programs?",
                  answer: "Yes, TAPT offers various training programs throughout the year, including safety workshops, driver training, and professional development for transportation supervisors."
                },
                {
                  question: "How can I access resources on the website?",
                  answer: "Most resources are freely available on our Resources page. Some resources are exclusive to TAPT members and require login credentials."
                },
                {
                  question: "How can I get involved with TAPT committees?",
                  answer: "TAPT has several committees that members can join. Contact the TAPT office or reach out to the committee chair for information on how to participate."
                }
              ].map((faq, index) => (
                <div key={index} className="bg-white p-6 rounded-lg shadow-sm">
                  <dt className="text-lg font-semibold text-secondary">{faq.question}</dt>
                  <dd className="mt-3 text-gray-600">{faq.answer}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>
    </div>
  );
};