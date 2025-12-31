import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Shield, MessageCircle, Calendar, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-eggshell">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#F4F1DE] via-[#F2CC8F]/20 to-[#E07A5F]/10">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="font-heading text-5xl md:text-6xl lg:text-7xl font-bold text-deepblue mb-6 tracking-tight">
                Connect with Vets,
                <span className="text-clay"> Anytime</span>
              </h1>
              <p className="text-lg md:text-xl text-[#787A91] mb-8 leading-relaxed">
                In remote places like Embu, Kenya, emergency vet care is hard to find. RafikiPets connects pet owners with verified veterinarians instantly.
              </p>
              <div className="flex flex-wrap gap-4">
                <button
                  data-testid="btn-get-started"
                  onClick={() => navigate('/register')}
                  className="bg-clay text-white rounded-full px-8 py-4 font-bold text-lg shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 active:scale-95"
                >
                  Get Started
                </button>
                <button
                  data-testid="btn-find-vet"
                  onClick={() => navigate('/login')}
                  className="bg-eggshell text-deepblue rounded-full px-8 py-4 font-semibold border border-deepblue/10 hover:bg-clay/10 transition-all"
                >
                  Find a Vet
                </button>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <img
                src="https://images.unsplash.com/photo-1737534195272-4b71b9aec672?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njd8MHwxfHNlYXJjaHwxfHxoYXBweSUyMGRvZyUyMHNtaWxpbmclMjBjbG9zZSUyMHVwfGVufDB8fHx8MTc2NzE2OTQyMnww&ixlib=rb-4.1.0&q=85"
                alt="Happy dog"
                className="rounded-3xl shadow-floating w-full h-auto"
              />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-24">
        <div className="text-center mb-16">
          <h2 className="font-heading text-4xl md:text-5xl font-bold text-deepblue mb-4">
            How RafikiPets Helps
          </h2>
          <p className="text-lg text-[#787A91] max-w-2xl mx-auto">
            Your pet's health matters. We make finding care simple.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: <Shield className="w-10 h-10" />,
              title: 'Verified Vets',
              description: 'All veterinarians are licensed and verified with their credentials checked.'
            },
            {
              icon: <Calendar className="w-10 h-10" />,
              title: 'Easy Booking',
              description: 'Book appointments instantly with transparent pricing and secure payments.'
            },
            {
              icon: <AlertCircle className="w-10 h-10" />,
              title: 'Emergency Care',
              description: 'Send emergency alerts to nearby vets for immediate assistance when you need it most.'
            },
            {
              icon: <MessageCircle className="w-10 h-10" />,
              title: 'Direct Chat',
              description: 'Chat with vets securely without sharing personal contact information.'
            },
            {
              icon: <Heart className="w-10 h-10" />,
              title: 'Pet Profiles',
              description: 'Keep all your pet medical records and appointment history in one place.'
            },
            {
              icon: <Shield className="w-10 h-10" />,
              title: 'Safe Payments',
              description: 'Secure payment processing with platform protection for peace of mind.'
            }
          ].map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              viewport={{ once: true }}
              className="bg-white rounded-3xl p-8 shadow-soft hover:shadow-md transition-all"
            >
              <div className="w-16 h-16 rounded-full bg-sage/10 text-sage flex items-center justify-center mb-4">
                {feature.icon}
              </div>
              <h3 className="font-heading text-xl font-bold text-deepblue mb-2">
                {feature.title}
              </h3>
              <p className="text-[#787A91]">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-clay/5 py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 md:px-8 text-center">
          <h2 className="font-heading text-4xl md:text-5xl font-bold text-deepblue mb-6">
            Ready to Care for Your Pet?
          </h2>
          <p className="text-lg text-[#787A91] mb-8">
            Join hundreds of pet owners already using RafikiPets
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              data-testid="btn-cta-owner"
              onClick={() => navigate('/register')}
              className="bg-clay text-white rounded-full px-8 py-4 font-bold text-lg shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
            >
              I'm a Pet Owner
            </button>
            <button
              data-testid="btn-cta-vet"
              onClick={() => navigate('/register')}
              className="bg-sage text-white rounded-full px-8 py-4 font-bold text-lg shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
            >
              I'm a Veterinarian
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
