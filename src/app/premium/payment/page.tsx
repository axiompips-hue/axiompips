// File: src/app/premium/payment/page.tsx
// Payment instructions and submission page

'use client';

import { Container } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Copy, Mail, Phone, CheckCircle2, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PaymentPage() {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');
  const [paymentMethod, setPaymentMethod] = useState<'easypaisa' | 'jazzcash'>('easypaisa');
  const [copied, setCopied] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const paymentInfo = {
    easypaisa: '03059843286',
    jazzcash: '030181532513',
  };

  const planPrices = {
    monthly: 'Rs. 1,250',
    yearly: 'Rs. 12,500',
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSubmit = () => {
    setSubmitted(true);
    setTimeout(() => {
      router.push('/dashboard');
    }, 3000);
  };

  if (submitted) {
    return (
      <Container className="py-12">
        <div className="max-w-2xl mx-auto">
          <Card className="bg-zinc-900/50 border-zinc-800 p-12 text-center">
            <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-green-400" />
            </div>
            <h1 className="text-3xl font-bold mb-4">Payment Submitted Successfully!</h1>
            <p className="text-zinc-400 mb-6">
              Thank you for your payment. We have received your transaction details and will verify them
              within 24 hours.
            </p>
            <p className="text-sm text-zinc-500 mb-8">
              You'll receive a confirmation email once your premium subscription is activated. If you have any
              questions, feel free to contact us via email or WhatsApp.
            </p>
            <Button onClick={() => router.push('/dashboard')} className="bg-indigo-600 hover:bg-indigo-500">
              Go to Dashboard
            </Button>
          </Card>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Complete Your Payment</h1>
          <p className="text-zinc-400">Follow the simple steps below to activate your premium subscription</p>
        </div>

        {/* Plan Selection */}
        <Card className="bg-zinc-900/50 border-zinc-800 p-8 mb-8">
          <h2 className="text-xl font-semibold mb-4">Select Your Plan</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <button
              onClick={() => setSelectedPlan('monthly')}
              className={`p-6 rounded-lg border-2 transition-all ${
                selectedPlan === 'monthly'
                  ? 'border-indigo-500 bg-indigo-500/10'
                  : 'border-zinc-700 hover:border-zinc-600'
              }`}
            >
              <div className="text-left">
                <h3 className="text-lg font-semibold mb-1">Monthly Plan</h3>
                <p className="text-2xl font-bold text-indigo-400">Rs. 1,250</p>
                <p className="text-sm text-zinc-500 mt-2">Billed monthly</p>
              </div>
            </button>

            <button
              onClick={() => setSelectedPlan('yearly')}
              className={`p-6 rounded-lg border-2 transition-all relative ${
                selectedPlan === 'yearly'
                  ? 'border-indigo-500 bg-indigo-500/10'
                  : 'border-zinc-700 hover:border-zinc-600'
              }`}
            >
              <div className="absolute -top-3 right-4 bg-green-500 text-white text-xs font-medium px-3 py-1 rounded-full">
                Save 17%
              </div>
              <div className="text-left">
                <h3 className="text-lg font-semibold mb-1">Yearly Plan</h3>
                <p className="text-2xl font-bold text-indigo-400">Rs. 12,500</p>
                <p className="text-sm text-zinc-500 mt-2">Billed annually (Rs. 1,042/month)</p>
              </div>
            </button>
          </div>
        </Card>

        {/* Payment Instructions */}
        <Card className="bg-zinc-900/50 border-zinc-800 p-8 mb-8">
          <h2 className="text-xl font-semibold mb-6">Payment Instructions</h2>

          {/* Step 1: Choose Payment Method */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-sm font-bold">
                1
              </div>
              <h3 className="text-lg font-semibold">Choose Payment Method</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-4 ml-11">
              <button
                onClick={() => setPaymentMethod('easypaisa')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  paymentMethod === 'easypaisa'
                    ? 'border-indigo-500 bg-indigo-500/10'
                    : 'border-zinc-700 hover:border-zinc-600'
                }`}
              >
                <h4 className="font-semibold">Easypaisa</h4>
              </button>
              <button
                onClick={() => setPaymentMethod('jazzcash')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  paymentMethod === 'jazzcash'
                    ? 'border-indigo-500 bg-indigo-500/10'
                    : 'border-zinc-700 hover:border-zinc-600'
                }`}
              >
                <h4 className="font-semibold">JazzCash</h4>
              </button>
            </div>
          </div>

          {/* Step 2: Send Payment */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-sm font-bold">
                2
              </div>
              <h3 className="text-lg font-semibold">Send Payment</h3>
            </div>
            <div className="ml-11 bg-zinc-800/50 rounded-lg p-6">
              <p className="text-sm text-zinc-400 mb-4">
                Send <strong className="text-white">{planPrices[selectedPlan]}</strong> to the following{' '}
                {paymentMethod === 'easypaisa' ? 'Easypaisa' : 'JazzCash'} account:
              </p>
              <div className="flex items-center gap-3 bg-zinc-900 rounded-lg p-4">
                <div className="flex-1">
                  <p className="text-xs text-zinc-500 mb-1">Account Number</p>
                  <p className="text-2xl font-mono font-bold">{paymentInfo[paymentMethod]}</p>
                </div>
                <Button
                  onClick={() => copyToClipboard(paymentInfo[paymentMethod], paymentMethod)}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  {copied === paymentMethod ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Step 3: Send Confirmation */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-sm font-bold">
                3
              </div>
              <h3 className="text-lg font-semibold">Send Payment Confirmation</h3>
            </div>
            <div className="ml-11 space-y-4">
              <p className="text-sm text-zinc-400">
                After making the payment, send us your payment screenshot and transaction ID via:
              </p>

              {/* WhatsApp Option */}
              <a
                href="https://wa.me/923171962461"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 bg-green-500/10 border border-green-500/30 rounded-lg p-4 hover:bg-green-500/20 transition-colors"
              >
                <Phone className="w-6 h-6 text-green-400 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-green-400">WhatsApp</p>
                  <p className="text-sm text-zinc-400">+92 317 1962461</p>
                </div>
              </a>

              {/* Email Option */}
              <a
                href="mailto:axiompips@gmail.com?subject=Premium Subscription Payment - [Your Name]&body=Plan: [Monthly/Yearly]%0APayment Method: [Easypaisa/JazzCash]%0ATransaction ID: [Your Transaction ID]%0A%0APlease find the payment screenshot attached."
                className="flex items-center gap-4 bg-indigo-500/10 border border-indigo-500/30 rounded-lg p-4 hover:bg-indigo-500/20 transition-colors"
              >
                <Mail className="w-6 h-6 text-indigo-400 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-indigo-400">Email</p>
                  <p className="text-sm text-zinc-400">axiompips@gmail.com</p>
                </div>
              </a>
            </div>
          </div>

          {/* Important Notice */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-semibold text-amber-400 mb-2">Important Information</p>
                <ul className="text-zinc-400 space-y-1">
                  <li>• We will verify your payment and activate your premium access within 24 hours</li>
                  <li>
                    • If we forget to activate within 24 hours, we'll activate immediately and refund 50% of
                    your payment
                  </li>
                  <li>• Make sure to include your transaction ID in the message</li>
                  <li>• Keep your payment screenshot for reference</li>
                </ul>
              </div>
            </div>
          </div>
        </Card>

        {/* Confirmation Button */}
        <div className="text-center">
          <Button
            onClick={handleSubmit}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 px-12 py-3 text-lg"
          >
            I've Sent the Payment
          </Button>
          <p className="text-sm text-zinc-500 mt-4">
            Click this button after you've sent your payment confirmation
          </p>
        </div>
      </div>
    </Container>
  );
}
