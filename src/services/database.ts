import { supabase, isSupabaseConfigured } from '../supabaseClient';

export interface Item {
  id: string;
  name: string;
  section: string;
  winningBid: {
    bidNum: string;
    amount: number;
  } | null;
  created_at?: string;
  updated_at?: string;
}

export interface Attendee {
  name: string;
  bidNum: string;
  wonItems: string[];
  created_at?: string;
  updated_at?: string;
}

// Database schema types (snake_case)
interface DbItem {
  id: string;
  name: string;
  section: string;
  winning_bid: {
    bidNum: string;
    amount: number;
  } | null;
  created_at?: string;
  updated_at?: string;
}

interface DbAttendee {
  bid_num: string;
  name: string;
  won_items: string[];
  created_at?: string;
  updated_at?: string;
}

// Helper functions to transform between app format and DB format
const transformItemFromDb = (dbItem: DbItem): Item => ({
  id: dbItem.id,
  name: dbItem.name,
  section: dbItem.section,
  winningBid: dbItem.winning_bid,
  created_at: dbItem.created_at,
  updated_at: dbItem.updated_at,
});

const transformItemToDb = (item: Omit<Item, 'created_at' | 'updated_at'>): Omit<DbItem, 'created_at' | 'updated_at'> => ({
  id: item.id,
  name: item.name,
  section: item.section,
  winning_bid: item.winningBid,
});

const transformAttendeeFromDb = (dbAttendee: DbAttendee): Attendee => ({
  name: dbAttendee.name,
  bidNum: dbAttendee.bid_num,
  wonItems: dbAttendee.won_items || [],
  created_at: dbAttendee.created_at,
  updated_at: dbAttendee.updated_at,
});

const transformAttendeeToDb = (attendee: Omit<Attendee, 'created_at' | 'updated_at'>): Omit<DbAttendee, 'created_at' | 'updated_at'> => ({
  bid_num: attendee.bidNum,
  name: attendee.name,
  won_items: attendee.wonItems || [],
});

// Items database operations
export const itemsService = {
  // Fetch all items
  async getAll(): Promise<Item[]> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Please check your .env file.');
    }
    
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .order('id', { ascending: true });
    
    if (error) {
      console.error('Error fetching items:', error);
      if (error.code === '42P01') {
        throw new Error('Database table "items" does not exist. Please run the SQL scripts from SUPABASE_SETUP.md');
      }
      if (error.code === '42501') {
        throw new Error('Permission denied. Please check your Row Level Security (RLS) policies in Supabase.');
      }
      throw error;
    }
    
    return (data || []).map(transformItemFromDb);
  },

  // Create a new item
  async create(item: Omit<Item, 'created_at' | 'updated_at'>): Promise<Item> {
    const dbItem = transformItemToDb(item);
    const { data, error } = await supabase
      .from('items')
      .insert([dbItem])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating item:', error);
      throw error;
    }
    
    return transformItemFromDb(data);
  },

  // Update an item
  async update(id: string, updates: Partial<Item>): Promise<Item> {
    const dbUpdates: Partial<DbItem> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.section !== undefined) dbUpdates.section = updates.section;
    if (updates.winningBid !== undefined) dbUpdates.winning_bid = updates.winningBid;
    
    const { data, error } = await supabase
      .from('items')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating item:', error);
      throw error;
    }
    
    return transformItemFromDb(data);
  },

  // Delete an item
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('items')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting item:', error);
      throw error;
    }
  },

  // Subscribe to real-time changes
  subscribe(callback: (payload: any) => void) {
    return supabase
      .channel('items-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'items' },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            callback({ ...payload, new: transformItemFromDb(payload.new as DbItem) });
          } else {
            callback(payload);
          }
        }
      )
      .subscribe();
  }
};

// Attendees database operations
export const attendeesService = {
  // Fetch all attendees
  async getAll(): Promise<Attendee[]> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Please check your .env file.');
    }
    
    const { data, error } = await supabase
      .from('attendees')
      .select('*')
      .order('bid_num', { ascending: true });
    
    if (error) {
      console.error('Error fetching attendees:', error);
      if (error.code === '42P01') {
        throw new Error('Database table "attendees" does not exist. Please run the SQL scripts from SUPABASE_SETUP.md');
      }
      if (error.code === '42501') {
        throw new Error('Permission denied. Please check your Row Level Security (RLS) policies in Supabase.');
      }
      throw error;
    }
    
    return (data || []).map(transformAttendeeFromDb);
  },

  // Create a new attendee
  async create(attendee: Omit<Attendee, 'created_at' | 'updated_at'>): Promise<Attendee> {
    const dbAttendee = transformAttendeeToDb(attendee);
    const { data, error } = await supabase
      .from('attendees')
      .insert([dbAttendee])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating attendee:', error);
      throw error;
    }
    
    return transformAttendeeFromDb(data);
  },

  // Update an attendee
  async update(bidNum: string, updates: Partial<Attendee>): Promise<Attendee> {
    const dbUpdates: Partial<DbAttendee> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.wonItems !== undefined) dbUpdates.won_items = updates.wonItems;
    
    const { data, error } = await supabase
      .from('attendees')
      .update(dbUpdates)
      .eq('bid_num', bidNum)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating attendee:', error);
      throw error;
    }
    
    return transformAttendeeFromDb(data);
  },

  // Delete an attendee
  async delete(bidNum: string): Promise<void> {
    const { error } = await supabase
      .from('attendees')
      .delete()
      .eq('bid_num', bidNum);
    
    if (error) {
      console.error('Error deleting attendee:', error);
      throw error;
    }
  },

  // Subscribe to real-time changes
  subscribe(callback: (payload: any) => void) {
    return supabase
      .channel('attendees-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'attendees' },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            callback({ ...payload, new: transformAttendeeFromDb(payload.new as DbAttendee) });
          } else {
            callback(payload);
          }
        }
      )
      .subscribe();
  }
};
