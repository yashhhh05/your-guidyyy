"use client";

import { motion } from "framer-motion";
import BookCard from "./BookCard";

interface Companion {
  id: string;
  name: string;
  subject: string;
  topic: string;
  duration: number;
}

interface TrendingCompanionsProps {
  companions?: Companion[];
}

const TrendingCompanions = ({ companions }: TrendingCompanionsProps) => {
  if (!companions || companions.length === 0) return null;

  return (
    <section className="w-full py-8">
      <div className="flex items-center gap-2 mb-8 ml-2">
        <h2 className="text-3xl font-bold ">
          Trending Now
        </h2>
      </div>
      
      {/* Use flex-wrap justify-center for a nice collection of books */}
      <div className="flex flex-wrap justify-center gap-8 p-4">
        {companions.map((companion, index) => (
          <motion.div
            key={companion.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1, duration: 0.4 }}
          >
             <BookCard {...companion} />
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default TrendingCompanions;
