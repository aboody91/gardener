import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Plant, User } from '../types';
import { supabase } from '../lib/supabase';

interface PlantModalProps {
  plant: Plant;
  onClose: () => void;
}

interface PlantUser {
  user: User;
  quantity: number;
}

const PlantModal: React.FC<PlantModalProps> = ({ plant, onClose }) => {
  const [users, setUsers] = useState<PlantUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlantUsers = async () => {
      try {
        const { data: plantsData, error: plantsError } = await supabase
          .from('plants')
          .select(`
            quantity,
            users (
              id,
              username,
              country
            )
          `)
          .eq('name', plant.name);

        if (plantsError) throw plantsError;

        const plantUsers = plantsData
          .map((p: any) => ({
            user: p.users,
            quantity: p.quantity,
          }))
          .filter((pu: PlantUser) => pu.user !== null);

        setUsers(plantUsers);
      } catch (error) {
        console.error('Error fetching plant users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlantUsers();
  }, [plant.name]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="p-6">
          <div className="aspect-w-16 aspect-h-9 mb-6">
            <img
              src={plant.image_url}
              alt={plant.name}
              className="rounded-lg object-cover w-full h-64"
            />
          </div>

          <h2 className="text-2xl font-bold mb-4">{plant.name}</h2>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Gardeners Growing This Plant</h3>
            
            {loading ? (
              <p className="text-gray-500">Loading gardeners...</p>
            ) : users.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {users.map((pu, index) => (
                  <div
                    key={pu.user.id + index}
                    className="border rounded-lg p-4 bg-gray-50"
                  >
                    <p className="font-medium">{pu.user.username}</p>
                    <p className="text-gray-600">
                      {pu.quantity} plant{pu.quantity > 1 ? 's' : ''} • {pu.user.country}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No other gardeners are growing this plant yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlantModal
