import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Info } from 'lucide-react';
import usePlantStore from '../store/plantStore';
import useAuthStore from '../store/authStore';
import PlantModal from '../components/PlantModal';
import WateringIndicator from '../components/WateringIndicator';
import { Plant } from '../types';
import { supabase } from '../lib/supabase';

interface PlantTemplate {
  id: string;
  name: string;
  image_url: string;
}

// Function to generate plant information (replace with your actual implementation)
const generatePlantInfo = (plantName: string): string => {
  return `Information and planting tips for ${plantName} will be displayed here.`;
};

const Dashboard = () => {
  const { user } = useAuthStore();
  const { plants, loading, error, fetchPlants, addPlant, updatePlant, deletePlant, waterPlant } = usePlantStore();
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [isAddingPlant, setIsAddingPlant] = useState(false);
  const [editingPlant, setEditingPlant] = useState<Plant | null>(null);
  const [plantSuggestions, setPlantSuggestions] = useState<PlantTemplate[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    quantity: 1,
    image_url: '',
    watering_days: '',
    watering_hours: '',
  });
  const [plantInfo, setPlantInfo] = useState<string>('');
  const [showPlantInfoModal, setShowPlantInfoModal] = useState(false);

  useEffect(() => {
    fetchPlants();
  }, [fetchPlants]);

  const handleNameChange = async (name: string) => {
    setFormData({ ...formData, name });
    
    if (name.length >= 3) {
      try {
        const { data, error } = await supabase
          .from('plant_templates')
          .select('id, name, image_url')
          .ilike('name', `%${name}%`)
          .limit(5);

        if (error) throw error;
        setPlantSuggestions(data || []);
      } catch (error) {
        console.error('Error fetching plant suggestions:', error);
      }
    } else {
      setPlantSuggestions([]);
    }
  };

  const handleSelectTemplate = (template: PlantTemplate) => {
    setFormData({
      ...formData,
      name: template.name,
      image_url: template.image_url,
    });
    setPlantSuggestions([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Convert empty string values to numbers
    const wateringDays = formData.watering_days === '' ? 0 : parseInt(formData.watering_days.toString());
    const wateringHours = formData.watering_hours === '' ? 0 : parseInt(formData.watering_hours.toString());

    try {
      if (editingPlant) {
        await updatePlant(editingPlant.id, {
          ...formData,
          watering_days: wateringDays,
          watering_hours: wateringHours,
          user_id: user!.id,
        });
      } else {
        await addPlant({
          ...formData,
          watering_days: wateringDays,
          watering_hours: wateringHours,
          user_id: user!.id,
        });

        // Check if a template with this name already exists
        if (formData.name.length >= 3) {
          const { data: existingTemplate } = await supabase
            .from('plant_templates')
            .select('id')
            .ilike('name', formData.name)
            .single();

          // Only add to templates if it doesn't exist
          if (!existingTemplate) {
            const { error: templateError } = await supabase
              .from('plant_templates')
              .insert([
                {
                  name: formData.name,
                  image_url: formData.image_url,
                  created_by: user!.id,
                },
              ])
              .select()
              .single();

            if (templateError && !templateError.message.includes('unique constraint')) {
              console.error('Error adding plant template:', templateError);
            }
          }
        }
      }
      setIsAddingPlant(false);
      setEditingPlant(null);
      setFormData({
        name: '',
        quantity: 1,
        image_url: '',
        watering_days: '',
        watering_hours: '',
      });
    } catch (error) {
      console.error('Error saving plant:', error);
    }
  };

  const handleEdit = (plant: Plant) => {
    setEditingPlant(plant);
    setFormData({
      name: plant.name,
      quantity: plant.quantity,
      image_url: plant.image_url,
      watering_days: plant.watering_days.toString(),
      watering_hours: plant.watering_hours.toString(),
    });
    setIsAddingPlant(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this plant?')) {
      try {
        await deletePlant(id);
      } catch (error) {
        console.error('Error deleting plant:', error);
      }
    }
  };

  const handleShowPlantInfo = async (plantName: string) => {
    // Generate plant info using Gemini AI
    const info = generatePlantInfo(plantName);
    setPlantInfo(info);
    setShowPlantInfoModal(true);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Garden Dashboard</h1>
        <button
          onClick={() => setIsAddingPlant(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Plant
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {isAddingPlant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4">
              {editingPlant ? 'Edit Plant' : 'Add New Plant'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700">
                  Plant Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  required
                />
                {plantSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full bg-white mt-1 rounded-md shadow-lg border border-gray-200">
                    {plantSuggestions.map((template) => (
                      <button
                        key={template.id}
                        type="button"
                        onClick={() => handleSelectTemplate(template)}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center space-x-3"
                      >
                        <img
                          src={template.image_url}
                          alt={template.name}
                          className="w-8 h-8 object-cover rounded"
                        />
                        <span>{template.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Image URL
                </label>
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Watering Days
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.watering_days}
                    onChange={(e) => setFormData({ ...formData, watering_days: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                    placeholder="Enter days"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Watering Hours
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={formData.watering_hours}
                    onChange={(e) => setFormData({ ...formData, watering_hours: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                    placeholder="Enter hours"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingPlant(false);
                    setEditingPlant(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md"
                >
                  {editingPlant ? 'Save Changes' : 'Add Plant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your plants...</p>
        </div>
      ) : plants.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600">You haven't added any plants yet.</p>
          <button
            onClick={() => setIsAddingPlant(true)}
            className="mt-4 text-green-600 hover:text-green-700 font-medium"
          >
            Add your first plant
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plants.map((plant) => (
            <div
              key={plant.id}
              className="bg-white rounded-lg shadow-md overflow-hidden relative"
            >
              <img
                src={plant.image_url}
                alt={plant.name}
                className="w-full h-48 object-cover cursor-pointer"
                onClick={() => setSelectedPlant(plant)}
              />
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-lg font-semibold">{plant.name}</h3>
                    <p className="text-gray-600">
                      Quantity: {plant.quantity}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(plant)}
                      className="text-gray-600 hover:text-gray-800"
                    >
                      <Pencil className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(plant.id)}
                      className="text-gray-600 hover:text-red-600"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                
                <WateringIndicator
                  lastWatered={plant.last_watered}
                  wateringDays={plant.watering_days}
                  wateringHours={plant.watering_hours}
                  onWater={() => waterPlant(plant.id)}
                />
              </div>
              <button
                onClick={() => handleShowPlantInfo(plant.name)}
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              >
                <Info className="h-5 w-5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {selectedPlant && (
        <PlantModal
          plant={selectedPlant}
          onClose={() => setSelectedPlant(null)}
        />
      )}

      {showPlantInfoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4">Plant Information</h2>
            <p>{plantInfo}</p>
            <div className="flex justify-end">
              <button
                onClick={() => setShowPlantInfoModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-500"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
