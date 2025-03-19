import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import axios from "axios";
import { Image } from "lucide-react";

const MemoryRecall = () => {
  const [memories, setMemories] = useState([]);
  const [selectedMemory, setSelectedMemory] = useState(null);
  
  useEffect(() => {
    fetchMemories();
  }, []);

  const fetchMemories = async () => {
    try {
      const response = await axios.get("/api/memories");
      setMemories(response.data);
    } catch (error) {
      console.error("Error fetching memories:", error);
    }
  };

  const handleMemorySelect = (memory) => {
    setSelectedMemory(memory);
  };

  return (
    <div className="bg-soft-yellow min-h-screen p-6 flex flex-col items-center">
      <motion.h1 
        className="text-4xl font-bold text-blue-700 mb-6"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        🌼 Memory Recall & Cognitive Support 💙
      </motion.h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {memories.map((memory) => (
          <motion.div key={memory._id} whileHover={{ scale: 1.05 }}>
            <Card 
              onClick={() => handleMemorySelect(memory)} 
              className="cursor-pointer bg-white shadow-lg rounded-2xl p-4 border border-blue-200 hover:shadow-2xl transition-all"
            >
              <CardContent className="flex flex-col items-center">
                <Image className="h-20 w-20 text-blue-500 mb-2" />
                <img src={memory.image} alt="Memory" className="rounded-xl w-full max-h-60 object-cover" />
                <p className="mt-3 text-gray-700 text-center font-medium">{memory.caption}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Dialog open={!!selectedMemory} onOpenChange={() => setSelectedMemory(null)}>
        <DialogContent className="bg-white p-6 rounded-2xl max-w-lg shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-blue-700 text-center">🌸 Memory Detail 🌸</DialogTitle>
          </DialogHeader>
          {selectedMemory && (
            <div className="flex flex-col items-center">
              <img src={selectedMemory.image} alt="Memory" className="rounded-xl w-full max-h-72 object-cover" />
              <p className="mt-4 text-gray-700 text-center text-lg">{selectedMemory.caption}</p>
              <Button onClick={() => setSelectedMemory(null)} className="mt-4 bg-blue-500 text-white px-6 py-2 rounded-full shadow-md hover:bg-blue-600">
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MemoryRecall;
