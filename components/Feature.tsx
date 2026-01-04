import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";

interface FeatureUnderstandingSectionProps {
  onGetStarted: () => void;
}

export default function FeatureUnderstandingSection({ onGetStarted }: FeatureUnderstandingSectionProps) {
  return (
    <section className="w-full py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-gray-50 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12 sm:mb-16"
         >
          <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold tracking-tight text-gray-900 mb-4">
            Feature Understanding
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Understand every feature digitally before using it. Our platform helps you
            clearly visualize what you get, how it works, and how it benefits your
            restaurant operations in real time.
          </p>
         </motion.div>

         {/* Feature 1 */}
         <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 items-center mb-12 sm:mb-16 lg:mb-20"
         >
          {/* Image */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="w-full"
          >
            <Card className="overflow-hidden rounded-xl lg:rounded-2xl shadow-lg">
              <img
                src="/homepage/register.png"
                alt="Dashboard Preview"
                className="w-full h-48 sm:h-64 lg:h-full object-cover"
              />
            </Card>
          </motion.div>

          {/* Content */}
          <Card className="rounded-xl lg:rounded-2xl shadow-md">
            <CardContent className="p-4 sm:p-6 lg:p-8">
              <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 mb-3 leading-tight">
                Complete Digital Customization
              </h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                Click on "<a href="#" onClick={(e) => {
                  e.preventDefault();
                  onGetStarted();
                 }} className="text-blue-600 underline underline-offset-4 decoration-blue-500 hover:decoration-blue-600 font-bold">Get Started</a>" to begin your digital restaurant journey.
                Once you click, you'll be guided to a simple registration form where you can register your restaurant, choose a suitable plan, and set up your admin account. After completing the setup, you'll gain instant access to powerful restaurant management tools.
              </p>
            </CardContent>
          </Card>
         </motion.div>

        {/* Feature 2 */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 items-center mb-12 sm:mb-16 lg:mb-20"
        >
          {/* Content */}
          <Card className="rounded-xl lg:rounded-2xl shadow-md order-2 lg:order-1">
            <CardContent className="p-4 sm:p-6 lg:p-8">
              <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 mb-3 leading-tight">
                Powerful Admin Control Panel
              </h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                From this centralized dashboard, you can manage your entire restaurant digitally—add and update menu items, configure tables, assign staff roles, track live orders, monitor sales, and customize your restaurant settings. The admin panel is designed to give you full control, real-time visibility, and smooth daily operations.
              </p>
            </CardContent>
          </Card>

          {/* Image */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="w-full order-1 lg:order-2"
          >
            <Card className="overflow-hidden rounded-xl lg:rounded-2xl shadow-lg">
              <img
                src="/homepage/pwrAdmn.png"
                alt="Operations Preview"
                className="w-full h-48 sm:h-64 lg:h-full object-cover"
              />
            </Card>
          </motion.div>
        </motion.div>

         {/* Feature 3 */}
         <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 items-center mb-12 sm:mb-16 lg:mb-20"
         >
          {/* Image */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="w-full"
          >
            <Card className="overflow-hidden rounded-xl lg:rounded-2xl shadow-lg">
              <img
                src="/homepage/kitchen.png"
                alt="Dashboard Preview"
                className="w-full h-48 sm:h-64 lg:h-full object-cover"
              />
            </Card>
          </motion.div>

          {/* Content */}
          <Card className="rounded-xl lg:rounded-2xl shadow-md">
            <CardContent className="p-4 sm:p-6 lg:p-8">
              <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 mb-3 leading-tight">
                Staff-Friendly Real-time Dashboard
              </h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                Your staff gets a simple, real-time kitchen dashboard designed for speed and clarity.
                The admin can easily add staff members and provide them with a secure restaurant ID and password. Using these credentials, kitchen staff can log in to the kitchen dashboard and view all orders live, clearly labeled with table numbers. They can track orders by status—new, cooking, and served—and update each order in real time.
              </p>
            </CardContent>
          </Card>
         </motion.div>

        {/* Feature 4 */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 items-center"
        >
          {/* Content */}
          <Card className="rounded-xl lg:rounded-2xl shadow-md order-2 lg:order-1">
            <CardContent className="p-4 sm:p-6 lg:p-8">
              <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 mb-3 leading-tight">
                What Do You Offer Your Customers?
              </h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                Admin has complete control over the digital menu, including food items, categories, pricing, images, and visual themes. When customers scan the QR code placed on their table, they instantly access the digital menu, where they can select items, place orders, make secure payments, and track their order status in real time. This end-to-end digital flow ensures faster service, improved accuracy, and a modern, hassle-free dining experience for every customer.
              </p>
            </CardContent>
          </Card>

          {/* Image */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="w-full order-1 lg:order-2"
          >
            <Card className="overflow-hidden rounded-xl lg:rounded-2xl shadow-lg">
              <img
                src="/homepage/cstmer.png"
                alt="Operations Preview"
                className="w-full h-48 sm:h-64 lg:h-full object-cover"
              />
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
