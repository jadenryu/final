'use client'

import { useState } from 'react'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/ui/accordion'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  ArrowRight,
  Sparkles,
  Box,
  Layers,
  MessageSquare,
  Cpu,
  Zap,
  Shield,
  Users,
  Target,
  Pencil,
  RotateCw,
  Move3d,
} from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50/30">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-lg border-b border-gray-200 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-2"
          >
            <Box className="w-8 h-8 text-brand-600" />
            <span className="text-xl font-semibold text-gray-900">
              modlr
            </span>
          </motion.div>

          {/* Navigation Links */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="hidden md:flex items-center space-x-8"
          >
            <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="text-gray-600 hover:text-gray-900 transition-colors">
              How It Works
            </a>
            <a href="#faq-section" className="text-gray-600 hover:text-gray-900 transition-colors">
              FAQ
            </a>
            <Link href="/about" className="text-gray-600 hover:text-gray-900 transition-colors">
              About
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-4"
          >
            <Link href="/login">
              <Button variant="ghost" className="text-gray-600 hover:text-gray-900">
                Sign In
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-brand-600 hover:bg-brand-700 text-white">
                Get Started
              </Button>
            </Link>
          </motion.div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Design 3D Models with<br />
              <span className="text-brand-600">Natural Language</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8 leading-relaxed">
              modlr is an AI-powered 3D modeling platform that transforms your ideas into professional CAD designs.
              Simply describe what you want to create, and watch as your vision comes to life in real-time.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/studio">
                <Button size="lg" className="bg-brand-600 hover:bg-brand-700 text-white h-14 px-10 text-lg">
                  Launch CAD Studio
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
            <div className="flex justify-center mt-4">
              <a href="#features">
                <Button size="lg" variant="outline" className="h-14 px-8 text-lg">
                  Learn More
                </Button>
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-4 bg-white">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Powerful CAD Features
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Professional-grade 3D modeling tools powered by cutting-edge AI technology
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <MessageSquare className="w-8 h-8 text-brand-600" />,
                title: "Natural Language Design",
                description: "Describe shapes in plain English. Say 'create a 50mm cube' or 'add a cylinder with 10mm radius' and watch your design materialize instantly."
              },
              {
                icon: <Layers className="w-8 h-8 text-brand-600" />,
                title: "Advanced Operations",
                description: "Full support for extrude, revolve, fillet, chamfer, and sketch operations. Create complex geometries from 2D profiles with parametric control."
              },
              {
                icon: <Move3d className="w-8 h-8 text-brand-600" />,
                title: "Real-time 3D Visualization",
                description: "Interactive 3D canvas with multiple view modes, grid overlays, and precision axis indicators. Rotate, zoom, and inspect your designs from any angle."
              },
              {
                icon: <Pencil className="w-8 h-8 text-brand-600" />,
                title: "Sketch & Extrude Workflow",
                description: "Create 2D sketches with rectangles, circles, and polygons, then extrude them into 3D solids. Classic CAD workflow made intuitive."
              },
              {
                icon: <RotateCw className="w-8 h-8 text-brand-600" />,
                title: "Revolve Operations",
                description: "Generate complex rotational parts by revolving 2D profiles around any axis. Perfect for vases, bottles, and turned components."
              },
              {
                icon: <Cpu className="w-8 h-8 text-brand-600" />,
                title: "AI-Powered Assistance",
                description: "Our intelligent CAD assistant understands engineering context and generates precise, manufacturable geometry from your descriptions."
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full border-gray-200 hover:border-brand-200 hover:shadow-lg transition-all">
                  <CardContent className="p-6">
                    <div className="mb-4">{feature.icon}</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 px-4">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From idea to 3D model in three simple steps
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Describe Your Design",
                description: "Use natural language to describe what you want to create. Be as specific or general as you like - our AI understands engineering terminology and design intent."
              },
              {
                step: "02",
                title: "AI Generates Geometry",
                description: "Our CAD AI interprets your request and generates precise 3D geometry. Complex shapes, assemblies, and parametric features are all supported."
              },
              {
                step: "03",
                title: "Refine & Export",
                description: "View your design in the interactive 3D canvas, make adjustments through conversation, and export your finished model for manufacturing or further development."
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="text-6xl font-bold text-brand-100 mb-4">{item.step}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Built for Designers & Engineers
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Join professionals who are accelerating their design workflow with AI
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
            {[
              { number: "10+", label: "Primitive Types" },
              { number: "5", label: "CAD Operations" },
              { number: "< 2s", label: "Generation Time" },
              { number: "Infinite", label: "Possibilities" }
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-4xl md:text-5xl font-bold text-brand-600 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Supported Operations */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="bg-gray-900 rounded-3xl p-12 text-white"
          >
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-6">Supported CAD Operations</h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Full parametric modeling capabilities at your fingertips
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { name: "Cube", desc: "Width, height, depth control" },
                { name: "Cylinder", desc: "Radius and height parameters" },
                { name: "Sphere", desc: "Radius-based generation" },
                { name: "Cone", desc: "Radius and height control" },
                { name: "Torus", desc: "Major and minor radius" },
                { name: "Sketch", desc: "2D profile creation" },
                { name: "Extrude", desc: "Sketch to 3D solid" },
                { name: "Revolve", desc: "Rotational symmetry" },
                { name: "Fillet", desc: "Edge rounding" },
                { name: "Chamfer", desc: "Edge beveling" }
              ].map((op, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  viewport={{ once: true }}
                  className="bg-white/10 rounded-xl p-4 backdrop-blur-sm"
                >
                  <h4 className="font-semibold text-brand-400 mb-1">{op.name}</h4>
                  <p className="text-sm text-gray-400">{op.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq-section" className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to know about modlr
            </p>
          </motion.div>

          <Accordion type="single" collapsible className="w-full">
            {[
              {
                question: "What types of 3D shapes can I create?",
                answer: "modlr supports a wide range of primitives including cubes, cylinders, spheres, cones, and tori. You can also create complex shapes using sketch-based operations like extrude and revolve, plus refinement operations like fillet and chamfer."
              },
              {
                question: "How does the AI understand my design intent?",
                answer: "Our AI is trained on CAD-specific terminology and engineering concepts. It understands dimensions in millimeters, standard CAD operations, and spatial relationships. You can describe shapes naturally, and the AI will generate precise geometry."
              },
              {
                question: "Can I create assemblies with multiple parts?",
                answer: "Yes! You can create multiple features in a single project. Each shape is added to your feature tree, where you can control visibility, suppression, and locking. The AI can create multiple related shapes in a single conversation."
              },
              {
                question: "What export formats are supported?",
                answer: "Currently, modlr supports JSON export of your project data. This includes all feature definitions, positions, rotations, and parameters. More export formats for manufacturing are coming soon."
              },
              {
                question: "How do sketch and extrude operations work?",
                answer: "First, create a 2D sketch on a plane (XY, XZ, or YZ) using shapes like rectangles, circles, or polygons. Then, extrude that sketch to create a 3D solid. The AI handles both steps and can create complex profiles."
              },
              {
                question: "Is there a limit to project complexity?",
                answer: "There's no hard limit on the number of features per project. The 3D canvas efficiently renders all visible features, and you can suppress features you're not actively working with to improve performance."
              }
            ].map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
              >
                <AccordionItem value={`item-${index}`} className="border-b border-gray-200">
                  <AccordionTrigger className="text-left font-semibold text-gray-900 hover:text-brand-600 py-6 text-lg">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 pb-6 leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 bg-gray-900">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to transform your design workflow?
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              Start creating professional 3D models with the power of AI. No complex software to learn - just describe what you want to build.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
              <Link href="/studio">
                <Button size="lg" className="bg-brand-600 hover:bg-brand-700 text-white h-12 px-8">
                  Launch CAD Studio
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>
            <p className="text-sm text-gray-400">
              No credit card required • Free to get started
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <Box className="w-10 h-10 text-brand-500" />
                <span className="text-2xl font-bold text-white">
                  modlr
                </span>
              </div>
              <p className="text-gray-400 max-w-md mb-6 leading-relaxed">
                AI-powered CAD design platform that transforms natural language descriptions into professional 3D models.
                Design faster, iterate smarter.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-4">Product</h3>
              <ul className="space-y-3">
                <li><a href="#features" className="text-gray-400 hover:text-white transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="text-gray-400 hover:text-white transition-colors">How It Works</a></li>
                <li><Link href="/studio" className="text-gray-400 hover:text-white transition-colors">CAD Studio</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-4">Company</h3>
              <ul className="space-y-3">
                <li><Link href="/about" className="text-gray-400 hover:text-white transition-colors">About</Link></li>
                <li><Link href="/support" className="text-gray-400 hover:text-white transition-colors">Support</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-700 pt-8 mt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="text-gray-400 text-sm">
                © 2025 modlr. All rights reserved.
              </div>
              <div className="flex items-center space-x-4 mt-4 md:mt-0">
                <Badge variant="secondary" className="bg-white/10 text-white border-white/20">
                  <Sparkles className="w-3 h-3 mr-1" />
                  AI-Powered CAD
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
