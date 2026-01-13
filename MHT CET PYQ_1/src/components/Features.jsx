import React from "react";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCoverflow, Pagination } from "swiper/modules";

//Professional B&W Icons
import {
  BookOpen, Bot, BarChart3, Trophy,
  Monitor, LayoutGrid, Layers, Save, Calendar
} from "lucide-react";

import "swiper/css";
import "swiper/css/effect-coverflow";
import "swiper/css/pagination";

export default function Features() {
  const features = [
    { icon: <BookOpen size={32}/>, title: "4000+ PYQ Questions", desc: "Complete collection of MHT CET previous year questions from 2015-2024 covering Physics, Chemistry, and Maths, and Biology" },
    { icon: <Bot size={32}/>, title: "AI-Powered Solutions", desc: "Get detailed, step-by-step solutions for every question analyzed by advanced AI with clear explanations" },
    { icon: <BarChart3 size={32}/>, title: "Advanced Analytics", desc: "Track your progress with detailed performance analytics, accuracy rates, time-series charts, and subject-wise breakdown" },
    { icon: <Trophy size={32}/>, title: "Leaderboard & Competition", desc: "Compete with peers, climb the leaderboard ranking, and stay motivated throughout your preparation journey" },
    { icon: <Monitor size={32}/>, title: "CBT Simulator", desc: "Experience real exam conditions with our Computer-Based Test simulator complete with timer and navigation" },
    { icon: <LayoutGrid size={32}/>, title: "Chapter-wise Organization", desc: "Practice questions organized by subject and chapters for systematic learning and better understanding" },
    { icon: <Layers size={32}/>, title: "Multiple Test Modes", desc: "Random tests, your-specific tests, subject-wise tests, and custom test creation for flexible practice" },
    { icon: <Save size={32}/>, title: "Save & Review", desc: "Save difficult questions, organize them by subject/chapter, and build your personalized question bank" },
    { icon: <Calendar size={32}/>, title: "Practice by Year", desc: "Access complete previous year papers from 2015-2024 to understand exam patterns and trends" },
  ];

  return (
    <section
      id="features"
      style={{
        padding: "100px 0",
        background: "radial-gradient(circle at top, #f5f4f3, #ffffff)",
        overflow: "hidden",
      }}
    >

      {/* Custom CSS to make Swiper dots black */}
      <style>
        {`
          .swiper-pagination-bullet-active {
            background: #000 !important;
          }
          .swiper-pagination-bullet {
            background: #666;
          }
        `}
      </style>

      <motion.h2
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{once: true}}
        transition={{ duration: 0.6 }}
        style={{
          fontSize: "48px",
          fontWeight: "800",
          textAlign: "center",
          marginBottom: "10px",
          color: "#111",
          letterSpacing: "-0.5px",
        }}
      >
        Everything You Need to Ace MHT CET
      </motion.h2>

      <motion.h2
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{once: true}}
        style={{
          fontSize: '18px',
          fontWeight: '500',
          textAlign: 'center',
          color: '#6B7280',
          marginBottom: '32px',
          lineHeight: '1.6',
        }}
      >
        Comprehensive preparation tools designed for MHT CET success
      </motion.h2>

      <Swiper
        effect="coverflow"
        grabCursor
        centeredSlides
        slidesPerView={1.5} // Default for mobile
        breakpoints={{
          640: { slidesPerView: 2 },
          1024: { slidesPerView: 3.5 }, //More slides = narrower cards
        }}
        loop
        coverflowEffect={{
          rotate: 0,
          stretch: 0,
          depth: 100,
          modifier: 2,
          slideShadows: false,
        }}
        pagination={{ clickable: true }}
        modules={[EffectCoverflow, Pagination]}
        style={{ padding: "40px 0 80px 0" }}
      >
        {features.map((f, i) => (
          <SwiperSlide key={i} style={{display: 'flex', justifyContent: 'center'}}>
            <motion.div
              whileHover={{ y: -10 }}
              transition={{ type: "spring", stiffness: 300 }}
              style={{

                width: "100%",
                maxWidth: "300px", // Reduced width
                height: "360px",
                borderRadius: "20px",
                background: "#fff",
                border: "1px solid #eaeaea",
                boxShadow: "0 20px 40px rgba(0,0,0,0.06)",
                padding: "40px 24px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
              }}
            >
              <div style={{ 

                color: "#111",
                marginBottom: "24px",
                background: "#f8f9fa",
                padding: "16px",
                borderRadius: "50%",
              }}>
                {f.icon}
              </div>

              <h3
                style={{
                  fontSize: "18px",
                  fontWeight: "700",
                  marginBottom: "12px",
                  color: "#111",
                }}
              >
                {f.title}
              </h3>

              <p
                style={{

                  fontSize: "14px",
                  lineHeight: "1.6",
                  color: "#666",
                  flex: 1,
                }}
              >
                {f.desc}
              </p>

              <span
                style={{

                  marginTop: "20px",
                  fontWeight: "600",
                  color: "#000", // Changed to black
                  fontSize: "14px",
                  display: "flex",
                  alignItems: "center",
                  cursor: "pointer",
                }}
              >
                Explore →
              </span>
            </motion.div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}