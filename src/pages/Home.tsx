import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plane as Plant } from 'lucide-react';
import useAuthStore from '../store/authStore';
import { supabase } from '../lib/supabase';

interface CommunityPlant {
  name: string;
  image_url: string;
  total_quantity: number;
  gardener_count: number;
}

const Home = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [communityPlants, setCommunityPlants] = useState<CommunityPlant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCommunityPlants = async () => {
      try {
        const { data, error } = await supabase
          .from('plants')
          .select(`
            name,
            image_url,
            quantity
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Aggregate plants data
        const plantMap = new Map<string, CommunityPlant>();
        
        data.forEach(plant => {
          if (plantMap.has(plant.name)) {
            const existing = plantMap.get(plant.name)!;
            plantMap.set(plant.name, {
              ...existing,
              total_quantity: existing.total_quantity + plant.quantity,
              gardener_count: existing.gardener_count + 1
            });
          } else {
            plantMap.set(plant.name, {
              name: plant.name,
              image_url: plant.image_url,
              total_quantity: plant.quantity,
              gardener_count: 1
            });
          }
        });

        setCommunityPlants(Array.from(plantMap.values()));
      } catch (error) {
        console.error('Error fetching community plants:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCommunityPlants();
  }, []);

  const handleGetStarted = () => {
    navigate(isAuthenticated ? '/dashboard' : '/login');
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div 
        className="relative h-[600px] bg-cover bg-center"
        style={{
          backgroundImage: 'url("https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80")',
          backgroundBlendMode: 'overlay',
          backgroundColor: 'rgba(0, 0, 0, 0.4)'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-900/60" />
        <div className="relative z-10 container mx-auto px-4 h-full flex flex-col justify-center items-center text-center text-white">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Grow Your Garden with Confidence
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-2xl">
            Plan, track, and nurture your plants with our intelligent garden planning tools
          </p>
          {!isAuthenticated && (
            <button
              onClick={handleGetStarted}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg text-lg transition-colors duration-200"
            >
              Get Started
            </button>
          )}
        </div>
      </div>

      {/* Community Plants Section */}
      <div className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-16 text-gray-800">
            Our Growing Community
          </h2>
          {loading ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
          ) : communityPlants.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {communityPlants.map((plant, index) => (
                <div
                  key={index}
                  className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-200"
                >
                  <div className="relative h-48">
                    <img
                      src={plant.image_url}
                      alt={plant.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="text-lg font-semibold text-white">
                        {plant.name}
                      </h3>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex justify-between items-center text-sm text-gray-600">
                      <span>{plant.gardener_count} gardener{plant.gardener_count !== 1 ? 's' : ''}</span>
                      <span>{plant.total_quantity} plant{plant.total_quantity !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-600">
              No plants have been added to our community yet.
              {!isAuthenticated && (
                <>
                  <br />
                  <button
                    onClick={handleGetStarted}
                    className="mt-4 text-green-600 hover:text-green-700 font-medium"
                  >
                    Be the first to add a plant!
                  </button>
                </>
              )}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
