import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShoppingCart, X, Coins } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';

interface FurnitureItem {
  id: string;
  name: string;
  category: string;
  xpCost: number;
  width: number;
  height: number;
  color: string;
  description: string | null;
}

interface FurnitureShopProps {
  onClose: () => void;
}

const categories = [
  { id: 'flooring', label: 'Flooring' },
  { id: 'wallpaper', label: 'Wallpaper' },
  { id: 'seating', label: 'Seating' },
  { id: 'tables', label: 'Tables' },
  { id: 'decorations', label: 'Decorations' },
  { id: 'lighting', label: 'Lighting' },
];

export function FurnitureShop({ onClose }: FurnitureShopProps) {
  const [selectedCategory, setSelectedCategory] = useState('flooring');
  const { toast } = useToast();

  // Fetch player XP
  const { data: xpData } = useQuery<{ xp: number }>({
    queryKey: ['/api/housing/xp'],
  });
  const playerXP = xpData?.xp || 0;

  // Fetch furniture catalog
  const { data: catalog = [] } = useQuery<FurnitureItem[]>({
    queryKey: ['/api/housing/catalog'],
  });

  // Filter by category
  const categoryItems = catalog.filter(item => item.category === selectedCategory);

  // Purchase mutation
  const purchaseMutation = useMutation({
    mutationFn: async (furnitureId: string) => {
      const response = await fetch('/api/housing/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ furnitureId, quantity: 1 }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Purchase failed');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Purchase Successful!',
        description: `Item added to your inventory. ${data.currentXP} XP remaining.`,
      });
      // Invalidate all relevant caches
      queryClient.invalidateQueries({ queryKey: ['/api/housing/xp'] });
      queryClient.invalidateQueries({ queryKey: ['/api/housing/inventory'] });
      queryClient.invalidateQueries({ queryKey: ['/api/inventory'] }); // Alternative inventory endpoint
    },
    onError: (error: any) => {
      toast({
        title: 'Purchase Failed',
        description: error.message || 'Not enough XP or item unavailable',
        variant: 'destructive',
      });
    },
  });

  const handlePurchase = (item: FurnitureItem) => {
    if (playerXP < item.xpCost) {
      toast({
        title: 'Insufficient XP',
        description: `You need ${item.xpCost} XP but only have ${playerXP} XP`,
        variant: 'destructive',
      });
      return;
    }
    purchaseMutation.mutate(item.id);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center" data-testid="furniture-shop">
      <Card className="w-full max-w-5xl max-h-[85vh] overflow-hidden bg-gradient-to-br from-purple-50 to-pink-100 dark:from-purple-950 dark:to-pink-950 border-4 border-purple-600 dark:border-purple-700 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-purple-300 dark:border-purple-700 bg-white/50 dark:bg-black/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShoppingCart className="w-8 h-8 text-purple-700 dark:text-purple-400" />
              <div>
                <h2 className="text-3xl font-bold text-purple-900 dark:text-purple-100">
                  Furniture Shop
                </h2>
                <p className="text-sm text-purple-600 dark:text-purple-400">
                  Decorate your house with style!
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-yellow-100 dark:bg-yellow-900 px-4 py-2 rounded-lg">
                <Coins className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                <span className="font-bold text-yellow-700 dark:text-yellow-300" data-testid="text-player-xp">
                  {playerXP} XP
                </span>
              </div>
              
              <Button 
                variant="ghost" 
                size="icon"
                onClick={onClose}
                data-testid="button-close-shop"
              >
                <X className="w-6 h-6" />
              </Button>
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="flex-1 flex flex-col">
            <TabsList className="w-full grid grid-cols-6 bg-purple-200 dark:bg-purple-900 m-4 mb-0">
              {categories.map(cat => (
                <TabsTrigger 
                  key={cat.id} 
                  value={cat.id}
                  data-testid={`tab-${cat.id}`}
                >
                  {cat.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="flex-1 overflow-auto p-6">
              {categories.map(cat => (
                <TabsContent key={cat.id} value={cat.id} className="mt-0">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {categoryItems.length === 0 ? (
                      <div className="col-span-full text-center py-12 text-purple-600 dark:text-purple-400">
                        No items in this category yet
                      </div>
                    ) : (
                      categoryItems.map(item => (
                        <Card
                          key={item.id}
                          className="p-4 bg-white dark:bg-slate-900 border-2 border-purple-300 dark:border-purple-700 hover:border-purple-500 dark:hover:border-purple-500 transition-all"
                          data-testid={`item-${item.id}`}
                        >
                          <div className="flex flex-col gap-3">
                            {/* Item Preview */}
                            <div 
                              className="w-full h-24 rounded-lg flex items-center justify-center"
                              style={{ backgroundColor: item.color }}
                            >
                              <span className="text-white font-bold text-sm text-center px-2">
                                {item.name}
                              </span>
                            </div>

                            {/* Item Info */}
                            <div>
                              <h3 className="font-semibold text-sm text-purple-900 dark:text-purple-100 mb-1">
                                {item.name}
                              </h3>
                              {item.description && (
                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                                  {item.description}
                                </p>
                              )}
                              
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1">
                                  <Coins className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                                  <span className="font-bold text-yellow-700 dark:text-yellow-300">
                                    {item.xpCost}
                                  </span>
                                </div>
                                
                                <Button
                                  size="sm"
                                  onClick={() => handlePurchase(item)}
                                  disabled={purchaseMutation.isPending || playerXP < item.xpCost}
                                  data-testid={`button-buy-${item.id}`}
                                >
                                  {playerXP < item.xpCost ? 'Not Enough XP' : 'Buy'}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))
                    )}
                  </div>
                </TabsContent>
              ))}
            </div>
          </Tabs>
        </div>
      </Card>
    </div>
  );
}
