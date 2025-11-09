// Party System Component
// Group formation, member management, shared XP, voice chat integration

'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useMobileHUD } from '@/lib/mobile-hud-context';

interface PartyMember {
  id: string;
  name: string;
  avatar: string;
  level: number;
  class: string;
  health: number;
  maxHealth: number;
  mana: number;
  maxMana: number;
  isLeader: boolean;
  isOnline: boolean;
  isSpeaking?: boolean;
  isMuted?: boolean;
}

interface Party {
  id: string;
  name: string;
  leaderId: string;
  members: PartyMember[];
  maxMembers: number;
  isPublic: boolean;
  sharedXP: boolean;
  createdAt: Date;
  settings: {
    lootMode: 'free-for-all' | 'round-robin' | 'need-greed' | 'master-loot';
    voiceEnabled: boolean;
    inviteMode: 'leader-only' | 'all-members';
    description?: string;
  };
}

export function PartySystem() {
  const [currentParty, setCurrentParty] = useState<Party | null>(null);
  const [availableParties, setAvailableParties] = useState<Party[]>([]);
  const [selectedTab, setSelectedTab] = useState<'current' | 'find'>('current');
  const [showCreateParty, setShowCreateParty] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPartyData();
  }, [selectedTab]);

  const fetchPartyData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch current party
      const currentResponse = await fetch('/api/parties/current');
      if (currentResponse.ok) {
        const data = await currentResponse.json();
        setCurrentParty(data);
      }

      // Fetch available parties if on find tab
      if (selectedTab === 'find') {
        const availableResponse = await fetch('/api/parties/available');
        const data = await availableResponse.json();
        setAvailableParties(data);
      }
    } catch (error) {
      console.error('Failed to fetch party data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedTab('current')}
            className={cn(
              "px-4 py-2 rounded-lg font-medium transition-all",
              selectedTab === 'current'
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            )}
          >
            My Party
          </button>
          <button
            onClick={() => setSelectedTab('find')}
            className={cn(
              "px-4 py-2 rounded-lg font-medium transition-all",
              selectedTab === 'find'
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            )}
          >
            Find Party
          </button>
        </div>

        {!currentParty && (
          <button
            onClick={() => setShowCreateParty(true)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90"
          >
            + Create Party
          </button>
        )}
      </div>

      {/* Content */}
      {selectedTab === 'current' && (
        currentParty ? (
          <CurrentPartyView party={currentParty} onUpdate={fetchPartyData} />
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-4xl mb-2">👥</p>
            <p>You're not in a party</p>
            <p className="text-sm mt-1">Create or join a party to play with others!</p>
          </div>
        )
      )}

      {selectedTab === 'find' && (
        <div className="space-y-3">
          {availableParties.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-4xl mb-2">🔍</p>
              <p>No parties available</p>
              <p className="text-sm mt-1">Create your own party!</p>
            </div>
          ) : (
            availableParties.map((party) => (
              <AvailablePartyCard key={party.id} party={party} onJoin={fetchPartyData} />
            ))
          )}
        </div>
      )}

      {/* Create Party Modal */}
      {showCreateParty && (
        <CreatePartyModal
          onClose={() => setShowCreateParty(false)}
          onCreated={() => {
            setShowCreateParty(false);
            setSelectedTab('current');
            fetchPartyData();
          }}
        />
      )}
    </div>
  );
}

function CurrentPartyView({ party, onUpdate }: { party: Party; onUpdate: () => void }) {
  const { pushNotification, preferences } = useMobileHUD();
  const [showInvite, setShowInvite] = useState(false);

  const currentUser = party.members.find(m => m.id === 'current-user-id'); // Replace with actual user ID
  const isLeader = currentUser?.isLeader || false;

  const handleLeaveParty = async () => {
    try {
      await fetch('/api/parties/leave', {
        method: 'POST',
      });
      
      pushNotification({
        type: 'info',
        title: 'Left Party',
        message: `You left ${party.name}`,
        duration: 3000,
      });

      onUpdate();
    } catch (error) {
      console.error('Failed to leave party:', error);
    }
  };

  const handleKickMember = async (memberId: string) => {
    try {
      await fetch('/api/parties/kick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId }),
      });

      if (preferences.hapticEnabled && navigator.vibrate) {
        navigator.vibrate(50);
      }

      onUpdate();
    } catch (error) {
      console.error('Failed to kick member:', error);
    }
  };

  const handleToggleVoice = async (memberId: string) => {
    // Implement voice mute/unmute
    console.log('Toggle voice for:', memberId);
  };

  return (
    <div className="space-y-4">
      {/* Party Info */}
      <div className="p-4 bg-muted rounded-lg border border-border">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-bold text-lg">{party.name}</h3>
            <p className="text-sm text-muted-foreground">
              {party.members.length}/{party.maxMembers} Members
            </p>
          </div>
          <div className="flex gap-2">
            {isLeader && (
              <button
                onClick={() => setShowInvite(true)}
                className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90"
              >
                Invite
              </button>
            )}
            <button
              onClick={handleLeaveParty}
              className="px-3 py-1.5 bg-red-500/10 text-red-500 rounded-lg text-sm font-medium hover:bg-red-500/20"
            >
              Leave
            </button>
          </div>
        </div>

        {/* Party Settings */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">Loot:</span>
            <span className="font-medium capitalize">{party.settings.lootMode.replace('-', ' ')}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">Shared XP:</span>
            <span className="font-medium">{party.sharedXP ? 'Yes' : 'No'}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">Voice:</span>
            <span className="font-medium">{party.settings.voiceEnabled ? 'Enabled' : 'Disabled'}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">Type:</span>
            <span className="font-medium">{party.isPublic ? 'Public' : 'Private'}</span>
          </div>
        </div>
      </div>

      {/* Members List */}
      <div className="space-y-2">
        <h4 className="font-bold text-sm">Party Members</h4>
        {party.members.map((member) => (
          <PartyMemberCard
            key={member.id}
            member={member}
            isLeader={isLeader}
            showVoice={party.settings.voiceEnabled}
            onKick={() => handleKickMember(member.id)}
            onToggleVoice={() => handleToggleVoice(member.id)}
          />
        ))}
      </div>

      {/* Invite Modal */}
      {showInvite && (
        <InviteToPartyModal
          partyId={party.id}
          onClose={() => setShowInvite(false)}
        />
      )}
    </div>
  );
}

function PartyMemberCard({
  member,
  isLeader,
  showVoice,
  onKick,
  onToggleVoice,
}: {
  member: PartyMember;
  isLeader: boolean;
  showVoice: boolean;
  onKick: () => void;
  onToggleVoice: () => void;
}) {
  const healthPercent = (member.health / member.maxHealth) * 100;
  const manaPercent = (member.mana / member.maxMana) * 100;

  return (
    <div className="p-3 bg-muted rounded-lg border border-border">
      <div className="flex items-center gap-3">
        {/* Avatar & Status */}
        <div className="relative">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-xl">
            {member.avatar}
          </div>
          <div className={cn(
            "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background",
            member.isOnline ? "bg-green-500" : "bg-gray-500"
          )} />
          {member.isSpeaking && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-[10px]">🔊</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-bold text-sm truncate">{member.name}</p>
            {member.isLeader && (
              <span className="px-1.5 py-0.5 bg-yellow-500/20 text-yellow-500 rounded text-xs font-medium">
                👑 Leader
              </span>
            )}
          </div>
          
          <p className="text-xs text-muted-foreground mb-2">
            Lv.{member.level} {member.class}
          </p>

          {/* Health & Mana Bars */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-background rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-red-500 to-red-400 transition-all"
                  style={{ width: `${healthPercent}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground w-12 text-right">
                {member.health}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-background rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all"
                  style={{ width: `${manaPercent}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground w-12 text-right">
                {member.mana}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-1">
          {showVoice && (
            <button
              onClick={onToggleVoice}
              className={cn(
                "p-2 rounded-lg text-sm",
                member.isMuted
                  ? "bg-red-500/10 text-red-500"
                  : "bg-muted text-foreground"
              )}
            >
              {member.isMuted ? '🔇' : '🔊'}
            </button>
          )}
          
          {isLeader && !member.isLeader && (
            <button
              onClick={onKick}
              className="p-2 bg-red-500/10 text-red-500 rounded-lg text-sm hover:bg-red-500/20"
            >
              ✕
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function AvailablePartyCard({ party, onJoin }: { party: Party; onJoin: () => void }) {
  const { pushNotification } = useMobileHUD();

  const handleJoin = async () => {
    try {
      const response = await fetch('/api/parties/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partyId: party.id }),
      });

      if (response.ok) {
        pushNotification({
          type: 'success',
          title: 'Joined Party!',
          message: `Welcome to ${party.name}`,
          duration: 3000,
        });
        onJoin();
      }
    } catch (error) {
      console.error('Failed to join party:', error);
    }
  };

  return (
    <div className="p-4 bg-muted rounded-lg border border-border">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-bold text-sm">{party.name}</h4>
            {party.isPublic && (
              <span className="px-1.5 py-0.5 bg-green-500/20 text-green-500 rounded text-xs">
                Public
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mb-2">
            {party.members.length}/{party.maxMembers} Members
          </p>
          {party.settings.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {party.settings.description}
            </p>
          )}
        </div>

        <button
          onClick={handleJoin}
          disabled={party.members.length >= party.maxMembers}
          className="ml-3 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
        >
          Join
        </button>
      </div>
    </div>
  );
}

function CreatePartyModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [partyName, setPartyName] = useState('');
  const [maxMembers, setMaxMembers] = useState(4);
  const [isPublic, setIsPublic] = useState(true);
  const [sharedXP, setSharedXP] = useState(true);
  const [lootMode, setLootMode] = useState<'free-for-all' | 'round-robin' | 'need-greed' | 'master-loot'>('free-for-all');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [description, setDescription] = useState('');

  const handleCreate = async () => {
    try {
      const response = await fetch('/api/parties/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: partyName,
          maxMembers,
          isPublic,
          sharedXP,
          settings: {
            lootMode,
            voiceEnabled,
            inviteMode: 'leader-only',
            description,
          },
        }),
      });

      if (response.ok) {
        onCreated();
      }
    } catch (error) {
      console.error('Failed to create party:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg max-w-md w-full max-h-[80vh] overflow-auto">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h3 className="text-lg font-bold">Create Party</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Party Name</label>
            <input
              type="text"
              placeholder="Enter party name..."
              value={partyName}
              onChange={(e) => setPartyName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-muted border border-border outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Max Members</label>
            <select
              value={maxMembers}
              onChange={(e) => setMaxMembers(parseInt(e.target.value))}
              className="w-full px-3 py-2 rounded-lg bg-muted border border-border outline-none focus:border-primary"
            >
              <option value={2}>2</option>
              <option value={4}>4</option>
              <option value={6}>6</option>
              <option value={8}>8</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Loot Mode</label>
            <select
              value={lootMode}
              onChange={(e) => setLootMode(e.target.value as any)}
              className="w-full px-3 py-2 rounded-lg bg-muted border border-border outline-none focus:border-primary"
            >
              <option value="free-for-all">Free For All</option>
              <option value="round-robin">Round Robin</option>
              <option value="need-greed">Need/Greed</option>
              <option value="master-loot">Master Loot</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description (Optional)</label>
            <textarea
              placeholder="What is your party about?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-muted border border-border outline-none focus:border-primary resize-none"
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm">Public Party</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={sharedXP}
                onChange={(e) => setSharedXP(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm">Shared XP</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={voiceEnabled}
                onChange={(e) => setVoiceEnabled(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm">Voice Chat Enabled</span>
            </label>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={!partyName.trim()}
              className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50"
            >
              Create Party
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-muted rounded-lg font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InviteToPartyModal({
  partyId,
  onClose,
}: {
  partyId: string;
  onClose: () => void;
}) {
  const [playerName, setPlayerName] = useState('');
  const { pushNotification } = useMobileHUD();

  const handleInvite = async () => {
    try {
      const response = await fetch('/api/parties/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partyId,
          playerName,
        }),
      });

      if (response.ok) {
        pushNotification({
          type: 'success',
          title: 'Invite Sent',
          message: `Invited ${playerName} to the party`,
          duration: 3000,
        });
        setPlayerName('');
        onClose();
      }
    } catch (error) {
      console.error('Failed to send invite:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg max-w-sm w-full">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h3 className="text-lg font-bold">Invite Player</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Player Name</label>
            <input
              type="text"
              placeholder="Enter player name..."
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-muted border border-border outline-none focus:border-primary"
              autoFocus
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleInvite}
              disabled={!playerName.trim()}
              className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50"
            >
              Send Invite
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-muted rounded-lg font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
