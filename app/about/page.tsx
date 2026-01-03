"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MapPin, Globe, Users, Target, Zap, Heart, Star, Award, Calendar, Linkedin, Facebook, Instagram } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <main className="bg-white text-gray-900">
        {/* ================= HERO SECTION ================= */}
        <section className="bg-gradient-to-br from-yellow-50 via-orange-50 to-white py-16 lg:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <Badge className="mb-4 bg-yellow-100 text-yellow-700 text-sm px-3 py-1">
                About Golden Fork
              </Badge>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight">
                Transforming Restaurants <br />
                <span className="text-yellow-500">One Innovation</span> at a Time
              </h1>
              <p className="mt-6 text-gray-600 max-w-3xl mx-auto text-lg leading-relaxed">
                Founded by a passionate freelancer, Golden Fork is dedicated to revolutionizing 
                restaurant management through cutting-edge digital solutions that make operations 
                seamless and customer experiences exceptional.
              </p>
            </div>
          </div>
        </section>

        {/* ================= FOUNDER SECTION ================= */}
        <section className="py-16 lg:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="order-2 lg:order-1">
                <Badge className="mb-4 bg-blue-100 text-blue-700">
                  Meet Our Founder
                </Badge>
                <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                  Sourav Kumar
                </h2>
                <h3 className="text-xl text-yellow-600 font-semibold mb-4">
                  Full-Stack Developer & Restaurant Tech Innovator
                </h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  As a passionate freelance developer with expertise in modern web technologies, 
                  I founded Golden Fork to bridge the gap between traditional restaurant operations 
                  and digital transformation. With years of experience in React, Next.js, and 
                  Firebase, I specialize in creating scalable solutions that empower restaurant 
                  owners to thrive in the digital age.
                </p>
                <p className="text-gray-600 mb-8 leading-relaxed">
                  My journey began when I realized how complex restaurant management could be. 
                  Golden Fork represents my commitment to simplifying operations while enhancing 
                  customer experiences through innovative technology.
                </p>
                
                {/* Social Links */}
                <div className="flex flex-wrap gap-4">
                  <Link 
                    href="https://www.linkedin.com/in/sourav-kumar-49082636b?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app" 
                    target="_blank"
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    <Linkedin className="h-4 w-4" />
                    LinkedIn
                  </Link>
                  <Link 
                    href="#" 
                    className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    <Facebook className="h-4 w-4" />
                    Facebook
                  </Link>
                  <Link 
                    href="#" 
                    className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    <Instagram className="h-4 w-4" />
                    Instagram
                  </Link>
                </div>
              </div>
              
              <div className="order-1 lg:order-2 flex justify-center">
                <div className="relative">
                  <div className="w-64 h-64 sm:w-72 sm:h-72 md:w-80 md:h-80 lg:w-96 lg:h-96 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 p-1 shadow-2xl">
                    <div className="w-full h-full rounded-full overflow-hidden bg-white">
                      <img 
                        src="/about/souravPIC.jpeg" 
                        alt="Sourav Kumar - Founder of Golden Fork" 
                        className="w-full h-full object-cover rounded-full hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  </div>
                  <div className="absolute -top-2 -right-2 sm:-top-4 sm:-right-4 bg-yellow-500 text-black p-2 sm:p-3 rounded-full shadow-lg">
                    <Award className="h-4 w-4 sm:h-6 sm:w-6" />
                  </div>
                  {/* Professional Badge */}
                  <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 bg-white border-2 border-yellow-500 rounded-full px-3 py-1 sm:px-4 sm:py-2 shadow-lg">
                    <span className="text-xs sm:text-sm font-semibold text-yellow-700">Full-Stack Developer</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= COMPANY LOGO & INFO ================= */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="mb-12">
              <div className="flex justify-center mb-6">
                <div className="h-24 w-24 rounded-full bg-yellow-500 flex items-center justify-center text-white text-4xl font-bold shadow-xl">
                  🍴
                </div>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">Golden Fork Technologies</h2>
              <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed">
                A freelance-driven technology company specializing in restaurant management solutions. 
                We combine innovation with practicality to deliver exceptional digital experiences.
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <Calendar className="h-10 w-10 text-yellow-500 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Founded</h3>
                <p className="text-gray-600">2024</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <Users className="h-10 w-10 text-blue-500 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Team Size</h3>
                <p className="text-gray-600">Freelancer</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <MapPin className="h-10 w-10 text-green-500 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Location</h3>
                <p className="text-gray-600">Remote</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <Star className="h-10 w-10 text-purple-500 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Focus</h3>
                <p className="text-gray-600">Restaurant Tech</p>
              </div>
            </div>
          </div>
        </section>

        {/* ================= VISION, VALUES & VELOCITY ================= */}
        <section className="py-16 lg:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">Our Core Principles</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                The foundation that drives everything we do at Golden Fork
              </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Vision */}
              <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-none shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-8 text-center">
                  <div className="bg-yellow-500 text-white p-4 rounded-full w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                    <Target className="h-8 w-8" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-yellow-700">Vision</h3>
                  <p className="text-gray-700 leading-relaxed">
                    To become the leading freelance-driven platform that empowers restaurants 
                    worldwide with intelligent, user-friendly technology solutions that transform 
                    how they operate and serve their customers.
                  </p>
                </CardContent>
              </Card>

              {/* Values */}
              <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-none shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-8 text-center">
                  <div className="bg-blue-500 text-white p-4 rounded-full w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                    <Heart className="h-8 w-8" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-blue-700">Values</h3>
                  <div className="text-gray-700 space-y-3">
                    <div className="font-medium">• Innovation First</div>
                    <div className="font-medium">• Customer-Centric Design</div>
                    <div className="font-medium">• Quality & Reliability</div>
                    <div className="font-medium">• Transparency</div>
                    <div className="font-medium">• Continuous Learning</div>
                  </div>
                </CardContent>
              </Card>

              {/* Velocity */}
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-none shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-8 text-center">
                  <div className="bg-green-500 text-white p-4 rounded-full w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                    <Zap className="h-8 w-8" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-green-700">Velocity</h3>
                  <p className="text-gray-700 leading-relaxed">
                    We move fast and adapt quickly. As a freelance operation, we maintain 
                    agility in development, rapid iteration cycles, and immediate response 
                    to market needs while ensuring top-quality deliverables.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* ================= WHY CHOOSE US ================= */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">Why Choose Golden Fork?</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                The unique advantages of working with a dedicated freelance developer
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="bg-yellow-100 text-yellow-600 p-3 rounded-lg w-12 h-12 flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-lg mb-3">Rapid Development</h3>
                <p className="text-gray-600">
                  Direct communication with the developer ensures faster iteration and 
                  immediate implementation of your feedback.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="bg-blue-100 text-blue-600 p-3 rounded-lg w-12 h-12 flex items-center justify-center mb-4">
                  <Heart className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-lg mb-3">Personal Touch</h3>
                <p className="text-gray-600">
                  Every project gets personal attention and care, ensuring your specific 
                  needs are understood and met perfectly.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="bg-green-100 text-green-600 p-3 rounded-lg w-12 h-12 flex items-center justify-center mb-4">
                  <Target className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-lg mb-3">Cost Effective</h3>
                <p className="text-gray-600">
                  Freelance structure means competitive pricing without compromising 
                  on quality or cutting-edge technology.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="bg-purple-100 text-purple-600 p-3 rounded-lg w-12 h-12 flex items-center justify-center mb-4">
                  <Globe className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-lg mb-3">Modern Tech Stack</h3>
                <p className="text-gray-600">
                  Built with React, Next.js, Firebase, and other cutting-edge technologies 
                  for maximum performance and scalability.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="bg-orange-100 text-orange-600 p-3 rounded-lg w-12 h-12 flex items-center justify-center mb-4">
                  <Users className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-lg mb-3">Dedicated Support</h3>
                <p className="text-gray-600">
                  Direct line to the developer for ongoing support, updates, and 
                  feature enhancements as your business grows.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="bg-red-100 text-red-600 p-3 rounded-lg w-12 h-12 flex items-center justify-center mb-4">
                  <Award className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-lg mb-3">Proven Expertise</h3>
                <p className="text-gray-600">
                  Years of experience in full-stack development with a focus on 
                  restaurant industry challenges and solutions.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ================= CTA SECTION ================= */}
        <section className="py-16 lg:py-20 bg-gradient-to-br from-yellow-500 to-orange-600 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Ready to Transform Your Restaurant?
            </h2>
            <p className="text-xl mb-8 text-yellow-100 max-w-2xl mx-auto">
              Let's work together to bring your restaurant into the digital future 
              with Golden Fork's innovative solutions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact">
                <Button className="bg-white text-yellow-600 hover:bg-gray-100 px-8 py-3 text-lg font-medium">
                  <Mail className="h-5 w-5 mr-2" />
                  Get in Touch
                </Button>
              </Link>
              
            </div>
            
            {/* Contact Info */}
            <div className="mt-12 pt-8 border-t border-yellow-400/30">
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center text-yellow-100">
                <div className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  <span>souravkumar.official42@gmail.com</span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  <span>Available Worldwide</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}