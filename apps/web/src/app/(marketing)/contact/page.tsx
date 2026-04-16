'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Phone, MapPin, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { contactApi } from '@/lib/api';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', company: '', subject: '', message: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await contactApi.submit({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        company: form.company || undefined,
        subject: form.subject,
        message: form.message,
      });
      toast.success("Message sent! We'll get back to you within 24 hours.");
      setSubmitted(true);
    } catch (err: any) {
      toast.error(err.message || 'Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white">
      <section className="bg-gradient-to-br from-slate-900 to-blue-950 text-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-extrabold mb-6">Contact Us</h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Have a question or need help? Our team is here for you.
          </p>
        </div>
      </section>

      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Form */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-8">Send us a message</h2>
              {submitted ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Message Sent!</h3>
                  <p className="text-gray-500">We'll respond within 24 business hours.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input id="firstName" placeholder="John" required value={form.firstName} onChange={handleChange} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input id="lastName" placeholder="Doe" required value={form.lastName} onChange={handleChange} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="john@company.com" required value={form.email} onChange={handleChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company">Company (optional)</Label>
                    <Input id="company" placeholder="Your company" value={form.company} onChange={handleChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input id="subject" placeholder="How can we help?" required value={form.subject} onChange={handleChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea id="message" placeholder="Tell us more..." rows={5} required value={form.message} onChange={handleChange} />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Sending...</> : 'Send Message'}
                  </Button>
                </form>
              )}
            </div>

            {/* Info */}
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-8">Get in touch</h2>
                <div className="space-y-6">
                  {[
                    { icon: Mail, label: 'Email', value: 'hello@freightflow.com' },
                    { icon: Phone, label: 'Phone', value: '+1 (555) 000-1234' },
                    { icon: MapPin, label: 'Address', value: '123 Logistics Way, Chicago, IL 60601' },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">{label}</p>
                        <p className="font-medium text-gray-900">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 rounded-2xl p-8">
                <h3 className="font-semibold text-gray-900 mb-2">Business Hours</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Monday – Friday</span>
                    <span>8:00 AM – 6:00 PM CST</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Saturday</span>
                    <span>9:00 AM – 2:00 PM CST</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sunday</span>
                    <span>Closed</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
