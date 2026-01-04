import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      {/* ================= NAVBAR ================= */}
      <nav className="sticky top-0 z-50 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-full bg-yellow-500 flex items-center justify-center text-white font-bold">
              🍴
            </div>
            <span className="text-xl font-bold">Golden Fork</span>
          </div>

          <Button className="bg-yellow-500 hover:bg-yellow-600 text-black">
            Login
          </Button>
        </div>
      </nav>

      {/* ================= HERO SECTION ================= */}
      <section className="bg-gradient-to-br from-yellow-50 to-white">
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <Badge className="mb-4 bg-yellow-100 text-yellow-700">
            Restaurant Automation System
          </Badge>

          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight">
            Make Your Restaurant <br />
            <span className="text-yellow-500">Fully Digital</span> with Golden Fork
          </h1>

          <p className="mt-6 text-gray-600 max-w-3xl mx-auto text-lg">
            Golden Fork provides a complete restaurant management solution —
            from QR-based digital menu to live kitchen tracking, staff management,
            billing, and analytics.
          </p>

          <div className="mt-8 flex justify-center gap-4 flex-wrap">
            <Button className="bg-yellow-500 hover:bg-yellow-600 text-black px-8 py-6 text-lg">
              Get Started
            </Button>
            <Button variant="outline" className="px-8 py-6 text-lg">
              View Demo
            </Button>
          </div>
        </div>
      </section>

      {/* ================= FEATURES ================= */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">
          Everything Your Restaurant Needs
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((item, i) => (
            <Card key={i} className="hover:shadow-lg transition">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <CheckCircle className="text-yellow-500 mt-1" />
                  <div>
                    <h3 className="font-semibold text-lg">{item.title}</h3>
                    <p className="text-gray-600 mt-2 text-sm">
                      {item.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ================= HOW IT WORKS ================= */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            How Golden Fork Works
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <div
                key={i}
                className="bg-white rounded-xl p-6 text-center shadow-sm"
              >
                <div className="text-3xl font-bold text-yellow-500 mb-4">
                  {i + 1}
                </div>
                <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                <p className="text-gray-600 text-sm">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className="py-20 bg-yellow-500 text-black text-center">
        <h2 className="text-3xl md:text-4xl font-bold">
          Upgrade Your Restaurant Today
        </h2>
        <p className="mt-4 max-w-xl mx-auto">
          Join restaurants that are growing faster with Golden Fork’s digital
          automation system.
        </p>
        <Button className="mt-6 bg-black text-white hover:bg-gray-900 px-8 py-6 text-lg">
          Register Your Restaurant
        </Button>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="bg-black text-gray-400 py-10">
        <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-3 gap-6">
          <div>
            <h3 className="text-white font-bold text-lg">Golden Fork</h3>
            <p className="text-sm mt-2">
              Smart restaurant automation for the digital era.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-2">Features</h4>
            <ul className="space-y-1 text-sm">
              <li>QR Menu & Ordering</li>
              <li>Admin Panel</li>
              <li>Kitchen Live Orders</li>
              <li>Staff Management</li>
              <li>Billing & Reports</li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-2">Company</h4>
            <ul className="space-y-1 text-sm">
              <li>About Us</li>
              <li>Contact</li>
              <li>Privacy Policy</li>
              <li>Terms & Conditions</li>
            </ul>
          </div>
        </div>

        <div className="text-center text-xs mt-8">
          © {new Date().getFullYear()} Golden Fork. All rights reserved.
        </div>
      </footer>
    </main>
  );
}

const features = [
  {
    title: "Admin Dashboard",
    description:
      "Manage food items, staff, tables, categories, orders, and restaurant settings from a powerful admin panel.",
  },
  {
    title: "Kitchen Live Orders",
    description:
      "Kitchen staff can track live orders with cooking, ready, and served status in real time.",
  },
  {
    title: "QR Code Digital Menu",
    description:
      "Generate unique QR codes for each table so customers can view menu and order instantly.",
  },
  {
    title: "Customer Ordering & Payment",
    description:
      "Customers can order food, track status, and pay bills directly from their phone.",
  },
  {
    title: "Menu Customization",
    description:
      "Customize customer menu theme, categories, food items, and pricing easily.",
  },
  {
    title: "Reports & Analytics",
    description:
      "Track most selling food, orders, revenue, and performance with detailed reports.",
  },
];

const steps = [
  {
    title: "Register Restaurant",
    description:
      "Create your restaurant account and choose a suitable automation package.",
  },
  {
    title: "Setup & Customize",
    description:
      "Add food, tables, staff, categories, and customize your digital menu.",
  },
  {
    title: "Go Digital",
    description:
      "Generate QR codes, accept orders, manage kitchen, and grow your business.",
  },
];
