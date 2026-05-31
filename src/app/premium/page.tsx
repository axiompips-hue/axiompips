// File: src/app/premium/page.tsx
// Premium upgrade page with pricing and payment instructions

import { Container } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import { Check, Crown, Zap, Shield, Cloud, FileDown } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Upgrade to Premium',
  description: 'Unlock unlimited access to all forex calculators, advanced tools, and export features',
};

export default function PremiumPage() {
  return (
    <Container className="py-12">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 bg-indigo-500/10 text-indigo-400 px-4 py-2 rounded-full mb-6">
          <Crown className="w-4 h-4" />
          <span className="text-sm font-medium">Premium Features</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Upgrade to{' '}
          <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Premium
          </span>
        </h1>
        <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
          Get unlimited access to all calculators, advanced trading tools, and export your data anytime
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
        {/* Monthly Plan */}
        <Card className="border-zinc-800 bg-zinc-900/50 p-8 relative">
          <div className="mb-6">
            <h3 className="text-2xl font-bold mb-2">Monthly</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold">$4.99</span>
              <span className="text-zinc-400">/month</span>
            </div>
          </div>

          <ul className="space-y-4 mb-8">
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-zinc-300">Unlimited calculator uses</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-zinc-300">Unlimited journal entries</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-zinc-300">Unlimited advanced tools access</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-zinc-300">Export to CSV, PDF, Excel</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-zinc-300">Cloud sync across devices</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-zinc-300">Priority email support</span>
            </li>
          </ul>

          <Link
            href="/premium/payment"
            className="block w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 rounded-lg transition-colors text-center"
          >
            Choose Monthly
          </Link>
        </Card>

        {/* Yearly Plan */}
        <Card className="border-indigo-500/50 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 p-8 relative">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-medium px-4 py-1 rounded-full">
            Save 17%
          </div>

          <div className="mb-6">
            <h3 className="text-2xl font-bold mb-2">Yearly</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold">$49.99</span>
              <span className="text-zinc-400">/year</span>
            </div>
            <p className="text-sm text-zinc-400 mt-1">Only $4.17/month</p>
          </div>

          <ul className="space-y-4 mb-8">
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-zinc-300">Unlimited calculator uses</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-zinc-300">Unlimited journal entries</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-zinc-300">Unlimited advanced tools access</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-zinc-300">Export to CSV, PDF, Excel</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-zinc-300">Cloud sync across devices</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-zinc-300">Priority email support</span>
            </li>
          </ul>

          <Link
            href="/premium/payment"
            className="block w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium py-3 rounded-lg transition-all text-center"
          >
            Choose Yearly
          </Link>
        </Card>
      </div>

      {/* Features Grid */}
      <div className="max-w-5xl mx-auto mb-16">
        <h2 className="text-3xl font-bold text-center mb-12">Everything You Need to Trade Better</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-indigo-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Unlimited Access</h3>
            <p className="text-zinc-400">
              Use all calculators and advanced tools without any daily or weekly limits
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-purple-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileDown className="w-8 h-8 text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Export Anywhere</h3>
            <p className="text-zinc-400">
              Download your trading journal and calculator results in CSV, PDF, or Excel format
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-pink-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Cloud className="w-8 h-8 text-pink-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Cloud Sync</h3>
            <p className="text-zinc-400">
              Access your trading journal from any device with automatic cloud synchronization
            </p>
          </div>
        </div>
      </div>

      {/* Trial Notice */}
      <Card className="max-w-3xl mx-auto bg-zinc-900/50 border-zinc-800 p-8">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <Shield className="w-6 h-6 text-green-400" />
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">7-Day Free Trial</h3>
            <p className="text-zinc-400 mb-4">
              New users get 7 days of full premium access absolutely free. No credit card required.
              Experience all premium features before you commit.
            </p>
            <p className="text-sm text-zinc-500">
              <strong>Money-Back Guarantee:</strong> If we forget to activate your premium access within 24
              hours of payment verification, we'll activate it immediately and refund 50% of your payment.
            </p>
          </div>
        </div>
      </Card>

      {/* FAQ Section */}
      <div className="max-w-3xl mx-auto mt-16">
        <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
        <div className="space-y-6">
          <Card className="bg-zinc-900/50 border-zinc-800 p-6">
            <h3 className="font-semibold mb-2">How does the payment process work?</h3>
            <p className="text-zinc-400 text-sm">
              After selecting a plan, you'll be directed to payment instructions. Send payment via Easypaisa
              or JazzCash, then submit your payment screenshot and transaction ID. We'll verify and activate
              your premium access within 24 hours.
            </p>
          </Card>

          <Card className="bg-zinc-900/50 border-zinc-800 p-6">
            <h3 className="font-semibold mb-2">Can I cancel my subscription?</h3>
            <p className="text-zinc-400 text-sm">
              Yes, you can cancel anytime by contacting us via email or WhatsApp. Your premium access will
              continue until the end of your current billing period.
            </p>
          </Card>

          <Card className="bg-zinc-900/50 border-zinc-800 p-6">
            <h3 className="font-semibold mb-2">What happens after my trial ends?</h3>
            <p className="text-zinc-400 text-sm">
              After the 7-day trial, you'll revert to the free tier with limited calculator uses (10/day),
              journal entries (50 total), and advanced tools (2/week). You can upgrade anytime to regain full
              access.
            </p>
          </Card>

          <Card className="bg-zinc-900/50 border-zinc-800 p-6">
            <h3 className="font-semibold mb-2">Do I need to provide payment details for the trial?</h3>
            <p className="text-zinc-400 text-sm">
              No! The 7-day free trial is completely free with no payment information required. Simply sign up
              and start using all premium features immediately.
            </p>
          </Card>
        </div>
      </div>
    </Container>
  );
}
