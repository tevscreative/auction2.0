/**
 * Migration utility to help migrate data from localStorage to Supabase
 * 
 * Usage: Import this in your component temporarily and call migrateLocalStorageToSupabase()
 * Or run this in the browser console after setting up Supabase
 */

import { itemsService, attendeesService } from '../services/database';

export async function migrateLocalStorageToSupabase(): Promise<void> {
  try {
    // Get data from localStorage
    const savedItems = localStorage.getItem('auctionItems');
    const savedAttendees = localStorage.getItem('auctionAttendees');
    
    if (!savedItems && !savedAttendees) {
      console.log('No data found in localStorage to migrate.');
      return;
    }
    
    let itemsMigrated = 0;
    let attendeesMigrated = 0;
    
    // Migrate items
    if (savedItems) {
      const items = JSON.parse(savedItems);
      console.log(`Found ${items.length} items to migrate...`);
      
      for (const item of items) {
        try {
          // Check if item already exists
          const existing = await itemsService.getAll();
          const exists = existing.some(i => i.id === item.id);
          
          if (!exists) {
            await itemsService.create(item);
            itemsMigrated++;
            console.log(`Migrated item: ${item.id} - ${item.name}`);
          } else {
            console.log(`Item ${item.id} already exists, skipping...`);
          }
        } catch (error) {
          console.error(`Error migrating item ${item.id}:`, error);
        }
      }
    }
    
    // Migrate attendees
    if (savedAttendees) {
      const attendees = JSON.parse(savedAttendees);
      console.log(`Found ${attendees.length} attendees to migrate...`);
      
      for (const attendee of attendees) {
        try {
          // Check if attendee already exists
          const existing = await attendeesService.getAll();
          const exists = existing.some(a => a.bidNum === attendee.bidNum);
          
          if (!exists) {
            await attendeesService.create(attendee);
            attendeesMigrated++;
            console.log(`Migrated attendee: ${attendee.bidNum} - ${attendee.name}`);
          } else {
            console.log(`Attendee ${attendee.bidNum} already exists, skipping...`);
          }
        } catch (error) {
          console.error(`Error migrating attendee ${attendee.bidNum}:`, error);
        }
      }
    }
    
    console.log(`\nMigration complete!`);
    console.log(`Items migrated: ${itemsMigrated}`);
    console.log(`Attendees migrated: ${attendeesMigrated}`);
    console.log(`\nYou can now safely clear localStorage if desired.`);
    
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  }
}

// Helper function to check if migration is needed
export function hasLocalStorageData(): boolean {
  const savedItems = localStorage.getItem('auctionItems');
  const savedAttendees = localStorage.getItem('auctionAttendees');
  return !!(savedItems || savedAttendees);
}
