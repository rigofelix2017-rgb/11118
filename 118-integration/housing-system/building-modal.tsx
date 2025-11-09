import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Pseudo3DObject } from '@/lib/object-3d-renderer';
import { 
  Building, 
  Building2, 
  MapPin, 
  Zap, 
  Users, 
  Cog, 
  Star, 
  Info,
  ArrowRight,
  Crown,
  Shield,
  Gem
} from 'lucide-react';

interface BuildingModalProps {
  isOpen: boolean;
  onClose: () => void;
  building: Pseudo3DObject | null;
}

interface BuildingFeature {
  icon: React.ComponentType<{ className?: string }>;
  name: string;
  description: string;
  available: boolean;
}

interface BuildingInfo {
  description: string;
  features: BuildingFeature[];
  actions: BuildingAction[];
  category: string;
  status: 'operational' | 'maintenance' | 'under_construction';
}

interface BuildingAction {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  available: boolean;
  action: () => void;
}

// Building data definitions
const getBuildingInfo = (building: Pseudo3DObject | null): BuildingInfo | null => {
  if (!building) return null;

  const commonActions: BuildingAction[] = [
    {
      id: 'visit',
      name: 'Visit',
      description: 'Go to this location',
      icon: MapPin,
      available: true,
      action: () => {
        console.log('Navigate to building:', building.name);
      }
    }
  ];

  switch (building.id) {
    case 'central-tower':
      return {
        description: 'The Central Tower stands as the heart of the city, a beacon of coordination and communication. This towering structure serves as the main hub for city-wide operations and strategic planning.',
        category: 'Government',
        status: 'operational',
        features: [
          {
            icon: Crown,
            name: 'Command Center',
            description: 'Central coordination hub for city operations',
            available: true
          },
          {
            icon: Zap,
            name: 'Communication Array',
            description: 'High-powered transmission systems',
            available: true
          },
          {
            icon: Users,
            name: 'Council Chamber',
            description: 'Meeting space for important decisions',
            available: true
          },
          {
            icon: Shield,
            name: 'Defense Systems',
            description: 'Advanced security and monitoring',
            available: false
          }
        ],
        actions: [
          ...commonActions,
          {
            id: 'access_command',
            name: 'Access Command Center',
            description: 'Enter the main control room',
            icon: Crown,
            available: true,
            action: () => console.log('Accessing command center')
          },
          {
            id: 'view_reports',
            name: 'View City Reports',
            description: 'Check current city status and metrics',
            icon: Info,
            available: true,
            action: () => console.log('Viewing city reports')
          }
        ]
      };

    case 'town-hall':
      return {
        description: 'The Town Hall serves as the civic center where citizens gather for community meetings, public services, and local governance. This building represents the democratic heart of the settlement.',
        category: 'Civic',
        status: 'operational',
        features: [
          {
            icon: Users,
            name: 'Assembly Hall',
            description: 'Large gathering space for community meetings',
            available: true
          },
          {
            icon: Building,
            name: 'Public Services',
            description: 'Citizen registration and documentation',
            available: true
          },
          {
            icon: Info,
            name: 'Information Center',
            description: 'Public announcements and notices',
            available: true
          },
          {
            icon: Cog,
            name: 'Administrative Offices',
            description: 'Local government operations',
            available: true
          }
        ],
        actions: [
          ...commonActions,
          {
            id: 'attend_meeting',
            name: 'Attend Town Meeting',
            description: 'Participate in community discussions',
            icon: Users,
            available: true,
            action: () => console.log('Attending town meeting')
          },
          {
            id: 'register_citizen',
            name: 'Citizen Services',
            description: 'Access registration and public services',
            icon: Building,
            available: true,
            action: () => console.log('Accessing citizen services')
          }
        ]
      };

    case 'crystal-formation':
    case 'energy-crystal':
      return {
        description: 'This mystical Energy Crystal pulses with raw energy, serving as a natural power source for the surrounding area. The crystal\'s luminescent glow provides both light and power to nearby structures.',
        category: 'Energy',
        status: 'operational',
        features: [
          {
            icon: Zap,
            name: 'Energy Generation',
            description: 'Produces clean, renewable energy',
            available: true
          },
          {
            icon: Gem,
            name: 'Crystal Resonance',
            description: 'Harmonizes with other crystal formations',
            available: true
          },
          {
            icon: Star,
            name: 'Luminescent Core',
            description: 'Provides natural lighting in the area',
            available: true
          },
          {
            icon: Shield,
            name: 'Energy Barrier',
            description: 'Creates protective fields when activated',
            available: false
          }
        ],
        actions: [
          ...commonActions,
          {
            id: 'harvest_energy',
            name: 'Harvest Energy',
            description: 'Collect energy from the crystal',
            icon: Zap,
            available: true,
            action: () => console.log('Harvesting crystal energy')
          },
          {
            id: 'attune_crystal',
            name: 'Attune to Crystal',
            description: 'Synchronize with the crystal\'s frequency',
            icon: Gem,
            available: true,
            action: () => console.log('Attuning to crystal')
          }
        ]
      };

    case 'watchtower':
      return {
        description: 'The Watchtower provides strategic surveillance of the surrounding area. From its elevated position, guards can monitor for threats and coordinate defense efforts across the settlement.',
        category: 'Defense',
        status: 'operational',
        features: [
          {
            icon: Building2,
            name: 'Observation Deck',
            description: 'High vantage point for surveillance',
            available: true
          },
          {
            icon: Shield,
            name: 'Defense Position',
            description: 'Strategic military outpost',
            available: true
          },
          {
            icon: Zap,
            name: 'Signal Beacon',
            description: 'Communication relay for alerts',
            available: true
          },
          {
            icon: Users,
            name: 'Guard Quarters',
            description: 'Housing for watch personnel',
            available: true
          }
        ],
        actions: [
          ...commonActions,
          {
            id: 'take_watch',
            name: 'Take Watch',
            description: 'Serve as lookout from the tower',
            icon: Building2,
            available: true,
            action: () => console.log('Taking watch duty')
          },
          {
            id: 'sound_alarm',
            name: 'Sound Alarm',
            description: 'Alert the settlement to danger',
            icon: Shield,
            available: true,
            action: () => console.log('Sounding alarm')
          }
        ]
      };

    case 'corner-building':
    case 'corner-market':
      return {
        description: 'The Corner Market serves as a bustling trading post where merchants and travelers gather to exchange goods, share news, and conduct business. This commercial hub keeps the local economy thriving.',
        category: 'Commerce',
        status: 'operational',
        features: [
          {
            icon: Building,
            name: 'Trading Floor',
            description: 'Open marketplace for goods exchange',
            available: true
          },
          {
            icon: Users,
            name: 'Merchant Quarters',
            description: 'Lodging for visiting traders',
            available: true
          },
          {
            icon: Info,
            name: 'Trade Board',
            description: 'Current prices and trading opportunities',
            available: true
          },
          {
            icon: Cog,
            name: 'Storage Warehouse',
            description: 'Secure storage for valuable goods',
            available: true
          }
        ],
        actions: [
          ...commonActions,
          {
            id: 'browse_goods',
            name: 'Browse Market',
            description: 'Look at available goods and prices',
            icon: Building,
            available: true,
            action: () => console.log('Browsing market goods')
          },
          {
            id: 'trade_items',
            name: 'Trade Items',
            description: 'Exchange goods with merchants',
            icon: ArrowRight,
            available: true,
            action: () => console.log('Trading items')
          }
        ]
      };

    case 'void-monument':
      return {
        description: 'The Void Monument stands as a mysterious structure of unknown origin. Its dark stone surface seems to absorb light, and strange energies emanate from within. Few dare to approach this enigmatic landmark.',
        category: 'Mystery',
        status: 'operational',
        features: [
          {
            icon: Star,
            name: 'Void Energy',
            description: 'Emanates mysterious dark energy',
            available: true
          },
          {
            icon: Gem,
            name: 'Ancient Runes',
            description: 'Inscriptions in an unknown language',
            available: true
          },
          {
            icon: Shield,
            name: 'Protective Aura',
            description: 'Repels most forms of interference',
            available: false
          },
          {
            icon: Info,
            name: 'Historical Artifact',
            description: 'Predates known civilization',
            available: true
          }
        ],
        actions: [
          ...commonActions,
          {
            id: 'study_runes',
            name: 'Study Runes',
            description: 'Attempt to decipher the ancient inscriptions',
            icon: Info,
            available: true,
            action: () => console.log('Studying ancient runes')
          },
          {
            id: 'sense_energy',
            name: 'Sense Energy',
            description: 'Feel the void energies emanating from the monument',
            icon: Star,
            available: true,
            action: () => console.log('Sensing void energy')
          }
        ]
      };

    case 'jukebox':
      return {
        description: 'The Jukebox brings music and entertainment to the settlement. This interactive music player contains a vast collection of songs and serves as a gathering point for celebration and relaxation.',
        category: 'Entertainment',
        status: 'operational',
        features: [
          {
            icon: Star,
            name: 'Music Library',
            description: 'Extensive collection of songs and melodies',
            available: true
          },
          {
            icon: Users,
            name: 'Social Hub',
            description: 'Gathering place for entertainment',
            available: true
          },
          {
            icon: Zap,
            name: 'Interactive Interface',
            description: 'Easy-to-use music selection system',
            available: true
          },
          {
            icon: Building,
            name: 'Sound System',
            description: 'High-quality audio projection',
            available: true
          }
        ],
        actions: [
          ...commonActions,
          {
            id: 'play_music',
            name: 'Play Music',
            description: 'Select and play a song from the library',
            icon: Star,
            available: true,
            action: () => console.log('Playing music from jukebox')
          },
          {
            id: 'add_song',
            name: 'Add Song',
            description: 'Contribute a new song to the collection',
            icon: ArrowRight,
            available: true,
            action: () => console.log('Adding song to jukebox')
          }
        ]
      };

    default:
      return {
        description: 'A structure in the settlement with various functions and purposes.',
        category: 'General',
        status: 'operational',
        features: [
          {
            icon: Building,
            name: 'Basic Structure',
            description: 'Provides shelter and functionality',
            available: true
          }
        ],
        actions: commonActions
      };
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'operational': return 'bg-green-500/20 text-green-400 border-green-500/50';
    case 'maintenance': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
    case 'under_construction': return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
    default: return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
  }
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'Government': return 'bg-purple-500/20 text-purple-400 border-purple-500/50';
    case 'Civic': return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
    case 'Energy': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50';
    case 'Defense': return 'bg-red-500/20 text-red-400 border-red-500/50';
    case 'Commerce': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
    case 'Mystery': return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/50';
    case 'Entertainment': return 'bg-pink-500/20 text-pink-400 border-pink-500/50';
    default: return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
  }
};

export function BuildingModal({ isOpen, onClose, building }: BuildingModalProps) {
  const buildingInfo = getBuildingInfo(building);

  if (!building || !buildingInfo) {
    return null;
  }
  
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent 
        className="max-w-2xl max-h-[90vh] bg-background border-border"
        data-testid="building-modal"
      >
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex flex-col space-y-2">
              <DialogTitle 
                className="text-2xl font-bold text-foreground"
                data-testid="building-modal-title"
              >
                {building.name || 'Unknown Structure'}
              </DialogTitle>
              <div className="flex items-center space-x-2">
                <Badge 
                  className={`border ${getCategoryColor(buildingInfo.category)}`}
                  data-testid="building-category-badge"
                >
                  {buildingInfo.category}
                </Badge>
                <Badge 
                  className={`border ${getStatusColor(buildingInfo.status)}`}
                  data-testid="building-status-badge"
                >
                  {buildingInfo.status.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-6">
            {/* Description */}
            <div>
              <h3 className="text-lg font-semibold mb-2 text-foreground">Description</h3>
              <p className="text-muted-foreground leading-relaxed" data-testid="building-description">
                {buildingInfo.description}
              </p>
            </div>

            <Separator />

            {/* Features */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-foreground">Features</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {buildingInfo.features.map((feature, index) => (
                  <Card 
                    key={index} 
                    className={`border ${feature.available ? 'border-border' : 'border-muted opacity-60'}`}
                    data-testid={`building-feature-${index}`}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center space-x-2 text-sm">
                        <feature.icon className="h-4 w-4" />
                        <span>{feature.name}</span>
                        {!feature.available && (
                          <Badge variant="secondary" className="text-xs">
                            Unavailable
                          </Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <CardDescription className="text-xs">
                        {feature.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <Separator />

            {/* Actions */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-foreground">Available Actions</h3>
              <div className="space-y-2">
                {buildingInfo.actions.map((action) => (
                  <Button
                    key={action.id}
                    variant={action.available ? "default" : "secondary"}
                    className="w-full justify-start"
                    disabled={!action.available}
                    onClick={action.action}
                    data-testid={`building-action-${action.id}`}
                  >
                    <action.icon className="h-4 w-4 mr-2" />
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{action.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {action.description}
                      </span>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="flex justify-end pt-4">
          <Button 
            variant="outline" 
            onClick={onClose}
            data-testid="building-modal-close"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}