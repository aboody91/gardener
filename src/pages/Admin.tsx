import React, { useState, useEffect } from 'react';
import { Users, MessageSquare, FileText, Pencil, Trash2, UserX, Check, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { User, ContactMessage, TermsAndConditions, Plant } from '../types';

type Tab = 'users' | 'messages' | 'terms';

interface UserWithPlants extends User {
  plants: Plant[];
}

interface UserDetailsModalProps {
  user: UserWithPlants;
  onClose: () => void;
  onEdit: (user: UserWithPlants) => void;
}

const UserDetailsModal: React.FC<UserDetailsModalProps> = ({ user, onClose, onEdit }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg max-w-2xl w-full mx-4 relative">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
      >
        <X className="h-6 w-6" />
      </button>

      <div className="p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold">{user.username}</h2>
            <p className="text-gray-600">{user.email}</p>
            <p className="text-sm text-gray-500">Country: {user.country}</p>
          </div>
          <button
            onClick={() => onEdit(user)}
            className="text-blue-600 hover:text-blue-700"
          >
            <Pencil className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Plants ({user.plants?.length || 0})</h3>
          {user.plants && user.plants.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {user.plants.map((plant) => (
                <div key={plant.id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center space-x-3">
                    <img
                      src={plant.image_url}
                      alt={plant.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                    <div>
                      <p className="font-medium">{plant.name}</p>
                      <p className="text-sm text-gray-600">
                        Quantity: {plant.quantity}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No plants added yet</p>
          )}
        </div>
      </div>
    </div>
  </div>
);

const Admin = () => {
  const [activeTab, setActiveTab] = useState<Tab>('users');
  const [users, setUsers] = useState<UserWithPlants[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [terms, setTerms] = useState<TermsAndConditions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingTerms, setEditingTerms] = useState(false);
  const [termsContent, setTermsContent] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserWithPlants | null>(null);
  const [editingUser, setEditingUser] = useState<UserWithPlants | null>(null);

  useEffect(() => {
    fetchData();
    // Set up real-time subscription for user status
    const userStatusSubscription = supabase.auth
      .onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
          fetchData();
        }
      });

    return () => {
      userStatusSubscription.data.subscription.unsubscribe();
    };
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'users') {
        const { data: authData } = await supabase.auth.getSession();
        const currentTime = new Date().getTime();
        
        const { data, error } = await supabase
          .from('users')
          .select(`
            *,
            plants (
              id,
              name,
              quantity,
              image_url,
              watering_days,
              watering_hours,
              last_watered
            )
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Check if user is currently online (session exists and last activity within 5 minutes)
        const usersWithStatus = data?.map(user => ({
          ...user,
          isOnline: authData.session?.user.id === user.id ||
                    (user.last_login && 
                     currentTime - new Date(user.last_login).getTime() < 5 * 60 * 1000)
        })) || [];

        setUsers(usersWithStatus);
      } else if (activeTab === 'messages') {
        const { data, error } = await supabase
          .from('contact_messages')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setMessages(data || []);
      } else if (activeTab === 'terms') {
        const { data, error } = await supabase
          .from('terms_conditions')
          .select('*')
          .order('updated_at', { ascending: false })
          .limit(1)
          .single();

        if (error && error.code !== 'PGRST116') throw error;
        setTerms(data || null);
        setTermsContent(data?.content || '');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) throw error;
      setUsers(users.filter(user => user.id !== userId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user');
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;

    try {
      const { error } = await supabase
        .from('contact_messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;
      setMessages(messages.filter(msg => msg.id !== messageId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete message');
    }
  };

  const handleUpdateUser = async (userId: string, updates: Partial<User>) => {
    try {
      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId);

      if (error) throw error;
      
      setUsers(users.map(user => 
        user.id === userId ? { ...user, ...updates } : user
      ));
      setEditingUser(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
    }
  };

  const handleSaveTerms = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      if (terms) {
        const { error } = await supabase
          .from('terms_conditions')
          .update({ content: termsContent, updated_at: new Date().toISOString() })
          .eq('id', terms.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('terms_conditions')
          .insert([{
            content: termsContent,
            updated_by: userData.user.id
          }]);
        if (error) throw error;
      }

      setEditingTerms(false);
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save terms');
    }
  };

  const formatLastLogin = (user: User) => {
    if (user.isOnline) {
      return <span className="text-green-600 font-medium">Online now</span>;
    }
    
    if (!user.last_login) {
      return 'Never';
    }

    const lastLogin = new Date(user.last_login);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - lastLogin.getTime()) / (1000 * 60));

    if (diffMinutes < 60) {
      return `${diffMinutes} minutes ago`;
    }

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) {
      return `${diffHours} hours ago`;
    }

    return lastLogin.toLocaleDateString() + ' ' + lastLogin.toLocaleTimeString();
  };

  const tabs = [
    { id: 'users', label: 'Users', icon: Users },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'terms', label: 'Terms & Conditions', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as Tab)}
                className={`
                  group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm
                  ${activeTab === id
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon className={`
                  mr-2 h-5 w-5
                  ${activeTab === id
                    ? 'text-green-500'
                    : 'text-gray-400 group-hover:text-gray-500'
                  }
                `} />
                {label}
              </button>
            ))}
          </nav>
        </div>

        {error && (
          <div className="mb-8 bg-red-50 p-4 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg">
            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Plants
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Login
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => setSelectedUser(user)}
                            className="flex items-center hover:text-green-600"
                          >
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {user.username}
                              </div>
                              <div className="text-sm text-gray-500">
                                {user.email}
                              </div>
                              <div className="text-xs text-gray-500">
                                {user.country}
                              </div>
                            </div>
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {user.plants?.length || 0} plants
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm">
                            {formatLastLogin(user)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => setEditingUser(user)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <Pencil className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Messages Tab */}
            {activeTab === 'messages' && (
              <div className="overflow-hidden">
                <ul className="divide-y divide-gray-200">
                  {messages.map((message) => (
                    <li key={message.id} className="p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">
                            {message.name}
                          </h3>
                          <p className="text-sm text-gray-500">{message.email}</p>
                          <p className="mt-2 text-sm text-gray-600">
                            {message.message}
                          </p>
                          <p className="mt-1 text-xs text-gray-400">
                            {new Date(message.created_at).toLocaleString()}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteMessage(message.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Terms & Conditions Tab */}
            {activeTab === 'terms' && (
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-medium text-gray-900">
                    Terms & Conditions
                  </h2>
                  {!editingTerms && (
                    <button
                      onClick={() => setEditingTerms(true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </button>
                  )}
                </div>

                {editingTerms ? (
                  <div>
                    <textarea
                      value={termsContent}
                      onChange={(e) => setTermsContent(e.target.value)}
                      rows={20}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                    />
                    <div className="mt-4 flex justify-end space-x-4">
                      <button
                        onClick={() => {
                          setEditingTerms(false);
                          setTermsContent(terms?.content || '');
                        }}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveTerms}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="prose max-w-none">
                    {terms?.content ? (
                      <div className="whitespace-pre-wrap">{terms.content}</div>
                    ) : (
                      <p className="text-gray-500 italic">
                        No terms and conditions have been set yet.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <UserDetailsModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onEdit={(user) => {
            setEditingUser(user);
            setSelectedUser(null);
          }}
        />
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4 p-6">
            <h2 className="text-xl font-bold mb-4">Edit User</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              handleUpdateUser(editingUser.id, {
                username: editingUser.username,
                country: editingUser.country,
              });
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Username
                  </label>
                  <input
                    type="text"
                    value={editingUser.username}
                    onChange={(e) => setEditingUser({
                      ...editingUser,
                      username: e.target.value
                    })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Country
                  </label>
                  <input
                    type="text"
                    value={editingUser.country}
                    onChange={(e) => setEditingUser({
                      ...editingUser,
                      country: e.target.value
                    })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
