import { useState, useEffect, FormEvent } from 'react';
import { itemsService, attendeesService, Item, Attendee } from '../services/database';

export default function SilentAuctionAdmin() {
  // State for auction items
  const [items, setItems] = useState<Item[]>([]);
  
  // State for attendees
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  
  // States for form inputs
  const [itemName, setItemName] = useState('');
  const [itemId, setItemId] = useState('');
  const [itemSection, setItemSection] = useState('');
  const [searchAttendeeBidNum, setSearchAttendeeBidNum] = useState('');
  const [attendeeName, setAttendeeName] = useState('');
  const [attendeeBidNum, setAttendeeBidNum] = useState('');
  const [winningBidNum, setWinningBidNum] = useState('');
  const [winningBidAmount, setWinningBidAmount] = useState<string>('');
  const [itemSearchTerm, setItemSearchTerm] = useState('');
  const [selectedItemId, setSelectedItemId] = useState('');
  
  // Form active states
  const [activeTab, setActiveTab] = useState('add-item');
  const [searchResults, setSearchResults] = useState<Item[] | null>(null);
  const [searchedItem, setSearchedItem] = useState<Item | null>(null);
  const [searchedAttendee, setSearchedAttendee] = useState<Attendee | null>(null);
  const [printMode, setPrintMode] = useState(false);
  
  // Add state for editing winning bid
  const [isEditingBid, setIsEditingBid] = useState(false);
  const [editBidNum, setEditBidNum] = useState('');
  const [editBidAmount, setEditBidAmount] = useState<number>(0);
  
  // Add state for editing items
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [editItemName, setEditItemName] = useState('');
  const [editItemId, setEditItemId] = useState('');
  const [editItemSection, setEditItemSection] = useState('');
  
  // Add state for editing attendees
  const [editingAttendee, setEditingAttendee] = useState<Attendee | null>(null);
  const [editAttendeeName, setEditAttendeeName] = useState('');
  const [editAttendeeBidNum, setEditAttendeeBidNum] = useState('');
  
  // Add state for sorting
  const [sortBy, setSortBy] = useState<'id' | 'name' | 'section' | 'status'>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Load initial data from Supabase
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [itemsData, attendeesData] = await Promise.all([
          itemsService.getAll(),
          attendeesService.getAll()
        ]);
        setItems(itemsData);
        setAttendees(attendeesData);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load data. Please check your Supabase connection.');
        // Fallback to localStorage if Supabase fails (for migration period)
        try {
          const savedItems = localStorage.getItem('auctionItems');
          const savedAttendees = localStorage.getItem('auctionAttendees');
          if (savedItems) setItems(JSON.parse(savedItems));
          if (savedAttendees) setAttendees(JSON.parse(savedAttendees));
        } catch (localErr) {
          console.error('Error loading from localStorage:', localErr);
        }
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  // Set up real-time subscriptions
  useEffect(() => {
    const itemsChannel = itemsService.subscribe((payload) => {
      if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
        const newItem = payload.new as Item;
        setItems(prev => {
          const existing = prev.findIndex(item => item.id === newItem.id);
          if (existing >= 0) {
            return prev.map((item, idx) => idx === existing ? newItem : item);
          }
          return [...prev, newItem];
        });
      } else if (payload.eventType === 'DELETE') {
        const oldItem = payload.old as { id: string };
        setItems(prev => prev.filter(item => item.id !== oldItem.id));
      }
    });
    
    const attendeesChannel = attendeesService.subscribe((payload) => {
      if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
        const newAttendee = payload.new as Attendee;
        setAttendees(prev => {
          const existing = prev.findIndex(att => att.bidNum === newAttendee.bidNum);
          if (existing >= 0) {
            return prev.map((att, idx) => idx === existing ? newAttendee : att);
          }
          return [...prev, newAttendee];
        });
      } else if (payload.eventType === 'DELETE') {
        const oldAttendee = payload.old as { bidNum: string };
        setAttendees(prev => prev.filter(att => att.bidNum !== oldAttendee.bidNum));
      }
    });
    
    return () => {
      itemsChannel.unsubscribe();
      attendeesChannel.unsubscribe();
    };
  }, []);
  
  // Add new auction item
  const handleAddItem = async () => {
    if (!itemName || !itemId) {
      alert('Please fill in Name and Item ID');
      return;
    }
    
    // Check if ID already exists
    if (items.some(item => item.id === itemId)) {
      alert(`Item ID ${itemId} already exists`);
      return;
    }
    
    try {
      const newItem = {
        name: itemName,
        id: itemId,
        section: itemSection,
        winningBid: null
      };
      
      await itemsService.create(newItem);
      // State will be updated via real-time subscription or we can update manually
      setItems([...items, newItem]);
      
      // Clear form
      setItemName('');
      setItemId('');
      setItemSection('');
    } catch (err) {
      console.error('Error adding item:', err);
      alert('Failed to add item. Please try again.');
    }
  };
  
  // Add new attendee
  const handleAddAttendee = async () => {
    if (!attendeeName || !attendeeBidNum) {
      alert('Please fill in all fields');
      return;
    }
    
    // Check if bid number already exists
    if (attendees.some(attendee => attendee.bidNum === attendeeBidNum)) {
      alert(`Bid # ${attendeeBidNum} already assigned`);
      return;
    }
    
    try {
      const newAttendee = {
        name: attendeeName,
        bidNum: attendeeBidNum,
        wonItems: []
      };
      
      await attendeesService.create(newAttendee);
      // State will be updated via real-time subscription or we can update manually
      setAttendees([...attendees, newAttendee]);
      
      // Clear form
      setAttendeeName('');
      setAttendeeBidNum('');
    } catch (err) {
      console.error('Error adding attendee:', err);
      alert('Failed to add attendee. Please try again.');
    }
  };
  
  // Add winning bid to item
  const handleAddWinningBid = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!winningBidNum || !winningBidAmount || !searchedItem) {
      alert('Please fill in all fields');
      return;
    }
    
    const bidAmount = parseFloat(winningBidAmount);
    if (isNaN(bidAmount)) {
      alert('Please enter a valid bid amount');
      return;
    }
    
    // Find the attendee
    const attendee = attendees.find(att => att.bidNum === winningBidNum);
    
    if (!attendee) {
      alert(`No attendee found with Bid # ${winningBidNum}`);
      return;
    }
    
    try {
      const winningBid = {
        bidNum: winningBidNum,
        amount: bidAmount
      };
      
      // Update the item in database
      await itemsService.update(searchedItem.id, { winningBid });
      
      // Update the attendee's won items
      const updatedWonItems = [...attendee.wonItems.filter(id => id !== searchedItem.id), searchedItem.id];
      await attendeesService.update(winningBidNum, { wonItems: updatedWonItems });
      
      // Update local state (will also be updated via real-time subscription)
      const updatedItems = items.map(item => {
        if (item.id === searchedItem.id) {
          return {
            ...item,
            winningBid
          };
        }
        return item;
      });
      
      const updatedAttendees = attendees.map(att => {
        if (att.bidNum === winningBidNum) {
          return {
            ...att,
            wonItems: updatedWonItems
          };
        }
        return att;
      });
      
      setItems(updatedItems);
      setAttendees(updatedAttendees);
      
      // Update the searched item
      setSearchedItem({
        ...searchedItem,
        winningBid
      });
      
      // Clear form
      setWinningBidNum('');
      setWinningBidAmount('');
    } catch (err) {
      console.error('Error adding winning bid:', err);
      const message = err instanceof Error ? err.message : String(err);
      alert(`Failed to record winning bid: ${message}\n\nIf tables are missing, run supabase-schema.sql in Supabase → SQL Editor.`);
    }
  };
  
  // Print attendee results
  const handlePrint = () => {
    setPrintMode(true);
    setTimeout(() => {
      window.print();
      setPrintMode(false);
    }, 100);
  };
  
  // Clear data - development helper
  const handleClearData = async () => {
    if (window.confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      try {
        // Delete all items
        await Promise.all(items.map(item => itemsService.delete(item.id)));
        // Delete all attendees
        await Promise.all(attendees.map(attendee => attendeesService.delete(attendee.bidNum)));
        
        setItems([]);
        setAttendees([]);
        setSearchedItem(null);
        setSearchResults(null);
        setSearchedAttendee(null);
        
        // Also clear localStorage for migration period
        localStorage.removeItem('auctionItems');
        localStorage.removeItem('auctionAttendees');
      } catch (err) {
        console.error('Error clearing data:', err);
        alert('Failed to clear all data. Please try again.');
      }
    }
  };
  
  // Calculate totals for an attendee
  const calculateAttendeeTotal = (attendee: Attendee) => {
    return items
      .filter(item => item.winningBid && item.winningBid.bidNum === attendee.bidNum)
      .reduce((total, item) => total + (item.winningBid ? item.winningBid.amount : 0), 0);
  };

  // Handle key press events for forms
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>, actionFn: () => void) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      actionFn();
    }
  };

  // Add CSV export functions
  const exportToCSV = (data: any[], filename: string) => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + data.map(row => Object.values(row).join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportAllData = () => {
    // Define the type for our export data
    type ExportData = {
      Type: string;
      ID: string;
      Name: string;
      Section: string;
      Status: string;
      'Winning Bid Amount': string;
      'Winner Bid #': string;
      'Winner Name': string;
      'Items Won'?: number;
      'Total Spent'?: string;
    };

    // Create a combined dataset
    const allData: ExportData[] = items.map(item => ({
      Type: 'Item',
      ID: item.id,
      Name: item.name,
      Section: item.section,
      Status: item.winningBid ? 'Sold' : 'Available',
      'Winning Bid Amount': item.winningBid ? `$${item.winningBid.amount.toFixed(2)}` : '-',
      'Winner Bid #': item.winningBid?.bidNum || '-',
      'Winner Name': item.winningBid ? 
        attendees.find(a => a.bidNum === item.winningBid?.bidNum)?.name || 'Unknown' : '-'
    }));

    // Add a separator row
    allData.push({ 
      Type: '', 
      ID: '', 
      Name: '', 
      Section: '', 
      Status: '', 
      'Winning Bid Amount': '', 
      'Winner Bid #': '', 
      'Winner Name': '' 
    });

    // Add attendees data
    attendees.forEach(attendee => {
      allData.push({
        Type: 'Attendee',
        ID: attendee.bidNum,
        Name: attendee.name,
        Section: '',
        Status: '',
        'Winning Bid Amount': '',
        'Winner Bid #': '',
        'Winner Name': '',
        'Items Won': items.filter(item => 
          item.winningBid && item.winningBid.bidNum === attendee.bidNum
        ).length,
        'Total Spent': `$${calculateAttendeeTotal(attendee).toFixed(2)}`
      });
    });

    exportToCSV(allData, 'auction_data.csv');
  };

  // Add function to handle editing winning bid
  const handleEditWinningBid = async () => {
    if (!searchedItem || !editBidNum || !editBidAmount) {
      alert('Please fill in all fields');
      return;
    }

    const bidAmount = parseFloat(editBidAmount.toString());
    if (isNaN(bidAmount)) {
      alert('Please enter a valid bid amount');
      return;
    }

    // Find the attendee
    const attendee = attendees.find(att => att.bidNum === editBidNum);
    if (!attendee) {
      alert(`No attendee found with Bid # ${editBidNum}`);
      return;
    }

    try {
      const winningBid = {
        bidNum: editBidNum,
        amount: bidAmount
      };
      
      // Update the item in database
      await itemsService.update(searchedItem.id, { winningBid });
      
      // Update local state
      const updatedItems = items.map(item => {
        if (item.id === searchedItem.id) {
          return {
            ...item,
            winningBid
          };
        }
        return item;
      });

      setItems(updatedItems);
      setSearchedItem({
        ...searchedItem,
        winningBid
      });
      setIsEditingBid(false);
    } catch (err) {
      console.error('Error editing winning bid:', err);
      const message = err instanceof Error ? err.message : String(err);
      alert(`Failed to update winning bid: ${message}\n\nIf tables are missing, run supabase-schema.sql in Supabase → SQL Editor.`);
    }
  };

  // Add function to handle sorting
  const sortItems = (items: Item[]) => {
    return [...items].sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'id':
          comparison = a.id.localeCompare(b.id);
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'section':
          comparison = a.section.localeCompare(b.section);
          break;
        case 'status':
          const aStatus = a.winningBid ? 'sold' : 'available';
          const bStatus = b.winningBid ? 'sold' : 'available';
          comparison = aStatus.localeCompare(bStatus);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  };

  // Handle editing an item
  const handleEditItem = (item: Item) => {
    setEditingItem(item);
    setEditItemName(item.name);
    setEditItemId(item.id);
    setEditItemSection(item.section);
  };

  // Handle saving edited item
  const handleSaveItem = async () => {
    if (!editingItem || !editItemName || !editItemId) {
      alert('Please fill in Name and Item ID');
      return;
    }

    // Check if ID already exists (and it's not the current item)
    if (editItemId !== editingItem.id && items.some(item => item.id === editItemId)) {
      alert(`Item ID ${editItemId} already exists`);
      return;
    }

    try {
      // If ID changed, we need to delete old and create new (since ID is primary key)
      if (editItemId !== editingItem.id) {
        // Create new item with new ID
        await itemsService.create({
          id: editItemId,
          name: editItemName,
          section: editItemSection,
          winningBid: editingItem.winningBid
        });
        // Delete old item
        await itemsService.delete(editingItem.id);
      } else {
        // Just update the item
        await itemsService.update(editingItem.id, {
          name: editItemName,
          section: editItemSection
        });
      }
      
      // Clear edit state
      setEditingItem(null);
      setEditItemName('');
      setEditItemId('');
      setEditItemSection('');
    } catch (err) {
      console.error('Error saving item:', err);
      alert('Failed to save item. Please try again.');
    }
  };

  // Handle deleting an item
  const handleDeleteItem = async (item: Item) => {
    if (item.winningBid) {
      if (!window.confirm(`Item "${item.name}" has a winning bid. Are you sure you want to delete it? This will also remove the bid from the attendee's won items.`)) {
        return;
      }
    } else {
      if (!window.confirm(`Are you sure you want to delete item "${item.name}"? This action cannot be undone.`)) {
        return;
      }
    }

    try {
      // If item has a winning bid, remove it from attendee's won items
      if (item.winningBid) {
        const attendee = attendees.find(att => att.bidNum === item.winningBid?.bidNum);
        if (attendee) {
          const updatedWonItems = attendee.wonItems.filter(id => id !== item.id);
          await attendeesService.update(attendee.bidNum, { wonItems: updatedWonItems });
        }
      }
      
      await itemsService.delete(item.id);
      
      // Clear searched item if it was deleted
      if (searchedItem?.id === item.id) {
        setSearchedItem(null);
        setSelectedItemId('');
      }
    } catch (err) {
      console.error('Error deleting item:', err);
      alert('Failed to delete item. Please try again.');
    }
  };

  // Handle editing an attendee
  const handleEditAttendee = (attendee: Attendee) => {
    setEditingAttendee(attendee);
    setEditAttendeeName(attendee.name);
    setEditAttendeeBidNum(attendee.bidNum);
  };

  // Handle saving edited attendee
  const handleSaveAttendee = async () => {
    if (!editingAttendee || !editAttendeeName || !editAttendeeBidNum) {
      alert('Please fill in all fields');
      return;
    }

    // Check if bid number already exists (and it's not the current attendee)
    if (editAttendeeBidNum !== editingAttendee.bidNum && attendees.some(att => att.bidNum === editAttendeeBidNum)) {
      alert(`Bid # ${editAttendeeBidNum} already assigned`);
      return;
    }

    try {
      // If bid number changed, we need to update all related items' winning bids
      if (editAttendeeBidNum !== editingAttendee.bidNum) {
        // Update all items with this attendee's winning bids
        const itemsToUpdate = items.filter(item => 
          item.winningBid && item.winningBid.bidNum === editingAttendee.bidNum
        );
        
        for (const item of itemsToUpdate) {
          if (item.winningBid) {
            await itemsService.update(item.id, {
              winningBid: {
                bidNum: editAttendeeBidNum,
                amount: item.winningBid.amount
              }
            });
          }
        }
        
        // Create new attendee with new bid number
        await attendeesService.create({
          bidNum: editAttendeeBidNum,
          name: editAttendeeName,
          wonItems: editingAttendee.wonItems
        });
        // Delete old attendee
        await attendeesService.delete(editingAttendee.bidNum);
      } else {
        // Just update the attendee
        await attendeesService.update(editingAttendee.bidNum, {
          name: editAttendeeName
        });
      }
      
      // Clear edit state
      setEditingAttendee(null);
      setEditAttendeeName('');
      setEditAttendeeBidNum('');
    } catch (err) {
      console.error('Error saving attendee:', err);
      alert('Failed to save attendee. Please try again.');
    }
  };

  // Handle deleting an attendee
  const handleDeleteAttendee = async (attendee: Attendee) => {
    const wonItemsCount = items.filter(item => 
      item.winningBid && item.winningBid.bidNum === attendee.bidNum
    ).length;
    
    if (wonItemsCount > 0) {
      if (!window.confirm(`Attendee "${attendee.name}" has ${wonItemsCount} winning bid(s). Are you sure you want to delete? This will remove the winning bids from those items.`)) {
        return;
      }
    } else {
      if (!window.confirm(`Are you sure you want to delete attendee "${attendee.name}"? This action cannot be undone.`)) {
        return;
      }
    }

    try {
      // Remove winning bids from all items won by this attendee
      const itemsToUpdate = items.filter(item => 
        item.winningBid && item.winningBid.bidNum === attendee.bidNum
      );
      
      for (const item of itemsToUpdate) {
        await itemsService.update(item.id, { winningBid: null });
      }
      
      await attendeesService.delete(attendee.bidNum);
      
      // Clear searched attendee if it was deleted
      if (searchedAttendee?.bidNum === attendee.bidNum) {
        setSearchedAttendee(null);
        setSearchResults(null);
      }
    } catch (err) {
      console.error('Error deleting attendee:', err);
      alert('Failed to delete attendee. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-semibold mb-2">Loading...</div>
          <div className="text-gray-600">Connecting to database...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {error && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
          <p className="font-bold">Warning</p>
          <p>{error}</p>
        </div>
      )}
      {/* Print Mode */}
      {printMode && searchedAttendee && searchResults && (
        <div className="print-only p-8 bg-white">
          <h1 className="text-3xl font-bold mb-6">BBA Auction 2025</h1>
          <div className="mb-6">
            <h2 className="text-xl font-semibold">Attendee Information</h2>
            <p className="text-lg">Name: {searchedAttendee.name}</p>
            <p className="text-lg">Bid #: {searchedAttendee.bidNum}</p>
          </div>
          
          <h2 className="text-xl font-semibold mb-4">Won Items</h2>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-2 text-left border">Item ID</th>
                <th className="p-2 text-left border">Name</th>
                <th className="p-2 text-left border">Section</th>
                <th className="p-2 text-right border">Bid Amount</th>
              </tr>
            </thead>
            <tbody>
              {searchResults.map(item => (
                <tr key={item.id} className="border-t">
                  <td className="p-2 border">{item.id}</td>
                  <td className="p-2 border">{item.name}</td>
                  <td className="p-2 border">{item.section}</td>
                  <td className="p-2 text-right border">${item.winningBid?.amount.toFixed(2) || '-'}</td>
                </tr>
              ))}
              <tr className="bg-gray-100 font-bold">
                <td className="p-2 border" colSpan={3}>Total</td>
                <td className="p-2 text-right border">${calculateAttendeeTotal(searchedAttendee).toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
          
          <div className="mt-8 text-center text-gray-500">
            <p>Thank you for your participation!</p>
          </div>
        </div>
      )}
      
      {/* Main Application */}
      {!printMode && (
        <div className="container mx-auto p-4">
          <h1 className="text-3xl font-bold mb-8 text-center text-blue-800">Silent Auction Admin Panel</h1>
          
          {/* Navigation Tabs */}
          <div className="flex mb-6 border-b">
            <button 
              className={`px-4 py-2 font-semibold ${activeTab === 'add-item' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
              onClick={() => setActiveTab('add-item')}
            >
              Add Item
            </button>
            <button 
              className={`px-4 py-2 font-semibold ${activeTab === 'add-attendee' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
              onClick={() => setActiveTab('add-attendee')}
            >
              Add Attendee
            </button>
            <button 
              className={`px-4 py-2 font-semibold ${activeTab === 'winning-bid' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
              onClick={() => setActiveTab('winning-bid')}
            >
              Record Winning Bid
            </button>
            <button 
              className={`px-4 py-2 font-semibold ${activeTab === 'lookup-attendee' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
              onClick={() => setActiveTab('lookup-attendee')}
            >
              Lookup Attendee
            </button>
            <button 
              className={`px-4 py-2 font-semibold ${activeTab === 'view-data' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
              onClick={() => setActiveTab('view-data')}
            >
              View Data
            </button>
          </div>
          
          {/* Add Item Form */}
          {activeTab === 'add-item' && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Add Auction Item</h2>
              <div className='grid-span-full lg:grid lg:grid-cols-7 gap-4'>
                <div className="lg:col-span-5">
                  <label className="block mb-1 font-medium">Item Name</label>
                  <input 
                    type="text" 
                    className="w-full p-2 border rounded"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, handleAddItem)}
                  />
                </div>
                <div className="lg:col-span-1">
                  <label className="block mb-1 font-medium">Item ID #</label>
                  <input 
                    type="text" 
                    className="w-full p-2 border rounded"
                    placeholder="e.g. 001, 002, 003"
                    value={itemId}
                    onChange={(e) => setItemId(e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, handleAddItem)}
                  />
                </div>
                <div className="lg:col-span-1">
                  <label className="block mb-1 font-medium">Section (optional)</label>
                  <input 
                    type="text" 
                    className="w-full p-2 border rounded"
                    placeholder="e.g. Section 1, Section 2"
                    value={itemSection}
                    onChange={(e) => setItemSection(e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, handleAddItem)}
                  />
                </div>
                <button 
                  onClick={handleAddItem}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 lg:col-span-7 w-full"
                >
                  Add Item
                </button>
              </div>
              
              {/* Display recently added items */}
              {items.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-medium mb-2">Recently Added Items</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="p-2">ID</th>
                          <th className="p-2">Name</th>
                          <th className="p-2">Section</th>
                          <th className="p-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.slice(-5).map((item) => (
                          <tr key={item.id} className="border-t">
                            <td className="p-2">{item.id}</td>
                            <td className="p-2">{item.name}</td>
                            <td className="p-2">{item.section}</td>
                            <td className="p-2">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleEditItem(item)}
                                  className="text-blue-600 hover:text-blue-800 text-sm"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteItem(item)}
                                  className="text-red-600 hover:text-red-800 text-sm"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Edit Item Form */}
                  {editingItem && (
                    <div className="mt-4 p-4 bg-gray-50 rounded border">
                      <h4 className="font-medium mb-3">Edit Item</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Item Name
                          </label>
                          <input
                            type="text"
                            value={editItemName}
                            onChange={(e) => setEditItemName(e.target.value)}
                            className="w-full p-2 border rounded"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Item ID Number
                          </label>
                          <input
                            type="text"
                            value={editItemId}
                            onChange={(e) => setEditItemId(e.target.value)}
                            className="w-full p-2 border rounded"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Section (optional)
                          </label>
                          <input
                            type="text"
                            value={editItemSection}
                            onChange={(e) => setEditItemSection(e.target.value)}
                            className="w-full p-2 border rounded"
                          />
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={handleSaveItem}
                            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
                          >
                            Save Changes
                          </button>
                          <button
                            onClick={() => {
                              setEditingItem(null);
                              setEditItemName('');
                              setEditItemId('');
                              setEditItemSection('');
                            }}
                            className="flex-1 bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* Add Attendee Form */}
          {activeTab === 'add-attendee' && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Add Attendee</h2>
              <div>
                <div className="mb-4">
                  <label className="block mb-1 font-medium">Attendee Name</label>
                  <input 
                    type="text" 
                    className="w-full p-2 border rounded"
                    value={attendeeName}
                    onChange={(e) => setAttendeeName(e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, handleAddAttendee)}
                  />
                </div>
                <div className="mb-4">
                  <label className="block mb-1 font-medium">Bid Number</label>
                  <input 
                    type="text" 
                    className="w-full p-2 border rounded"
                    placeholder="e.g. 009, 134"
                    value={attendeeBidNum}
                    onChange={(e) => setAttendeeBidNum(e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, handleAddAttendee)}
                  />
                </div>
                <button 
                  onClick={handleAddAttendee} 
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Add Attendee
                </button>
              </div>
              
              {/* Display recently added attendees */}
              {attendees.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-medium mb-2">Recently Added Attendees</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="p-2">Bid #</th>
                          <th className="p-2">Name</th>
                          <th className="p-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attendees.slice(-5).map((attendee) => (
                          <tr key={attendee.bidNum} className="border-t">
                            <td className="p-2">{attendee.bidNum}</td>
                            <td className="p-2">{attendee.name}</td>
                            <td className="p-2">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleEditAttendee(attendee)}
                                  className="text-blue-600 hover:text-blue-800 text-sm"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteAttendee(attendee)}
                                  className="text-red-600 hover:text-red-800 text-sm"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Edit Attendee Form */}
                  {editingAttendee && (
                    <div className="mt-4 p-4 bg-gray-50 rounded border">
                      <h4 className="font-medium mb-3">Edit Attendee</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Attendee Name
                          </label>
                          <input
                            type="text"
                            value={editAttendeeName}
                            onChange={(e) => setEditAttendeeName(e.target.value)}
                            className="w-full p-2 border rounded"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Bid Number
                          </label>
                          <input
                            type="text"
                            value={editAttendeeBidNum}
                            onChange={(e) => setEditAttendeeBidNum(e.target.value)}
                            className="w-full p-2 border rounded"
                            required
                          />
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={handleSaveAttendee}
                            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
                          >
                            Save Changes
                          </button>
                          <button
                            onClick={() => {
                              setEditingAttendee(null);
                              setEditAttendeeName('');
                              setEditAttendeeBidNum('');
                            }}
                            className="flex-1 bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* Record Winning Bid Section */}
          {activeTab === 'winning-bid' && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-bold mb-4">Record Winning Bid</h2>
              
              {/* Search and Sort Controls */}
              <div className="mb-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search Items
                  </label>
                  <input
                    type="text"
                    value={itemSearchTerm}
                    onChange={(e) => setItemSearchTerm(e.target.value)}
                    placeholder="Search by ID or name..."
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div className="flex space-x-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sort By
                    </label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as 'id' | 'name' | 'section' | 'status')}
                      className="w-full p-2 border rounded"
                    >
                      <option value="id">ID</option>
                      <option value="name">Name</option>
                      <option value="section">Section</option>
                      <option value="status">Status</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Order
                    </label>
                    <select
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                      className="w-full p-2 border rounded"
                    >
                      <option value="asc">Ascending</option>
                      <option value="desc">Descending</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Display All Items */}
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-2">ID</th>
                      <th className="p-2">Name</th>
                      <th className="p-2">Section</th>
                      <th className="p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortItems(items)
                      .filter(item => 
                        item.id.toLowerCase().includes(itemSearchTerm.toLowerCase()) ||
                        item.name.toLowerCase().includes(itemSearchTerm.toLowerCase())
                      )
                      .map((item) => (
                        <tr 
                          key={item.id} 
                          className={`border-t cursor-pointer hover:bg-gray-50 ${
                            item.id === selectedItemId ? 'bg-blue-50' : ''
                          }`}
                          onClick={() => {
                            setSelectedItemId(item.id);
                            setSearchedItem(item);
                          }}
                        >
                          <td className="p-2">{item.id}</td>
                          <td className="p-2">{item.name}</td>
                          <td className="p-2">{item.section}</td>
                          <td className="p-2">
                            {item.winningBid ? (
                              <span className="text-green-600">Sold</span>
                            ) : (
                              <span className="text-gray-600">Available</span>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {/* Winning Bid Form */}
              {searchedItem && (
                <div className="mt-6 p-4 bg-gray-50 rounded">
                  <h3 className="text-lg font-semibold mb-4">Record Bid for: {searchedItem.name}</h3>
                  
                  {searchedItem.winningBid ? (
                    <div className="p-3 bg-green-100 rounded">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">Winning Bid Recorded</p>
                          <p><strong>Bid #:</strong> {searchedItem.winningBid.bidNum}</p>
                          <p><strong>Amount:</strong> ${searchedItem.winningBid.amount.toFixed(2)}</p>
                          <p><strong>Winner:</strong> {
                            attendees.find(a => a.bidNum === searchedItem.winningBid?.bidNum)?.name || 'Unknown'
                          }</p>
                        </div>
                        {!isEditingBid && (
                          <button
                            onClick={() => {
                              setIsEditingBid(true);
                              setEditBidNum(searchedItem.winningBid?.bidNum || '');
                              setEditBidAmount(searchedItem.winningBid?.amount || 0);
                            }}
                            className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600"
                          >
                            Edit Bid
                          </button>
                        )}
                      </div>
                      {isEditingBid && (
                        <div className="mt-4 p-4 bg-white rounded border">
                          <h4 className="font-medium mb-3">Edit Winning Bid</h4>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Bid Number
                              </label>
                              <input
                                type="text"
                                value={editBidNum}
                                onChange={(e) => {
                                  setEditBidNum(e.target.value);
                                  // Find attendee name as user types
                                  const attendee = attendees.find(a => a.bidNum === e.target.value);
                                  if (attendee) {
                                    const nameLabel = document.getElementById('edit-attendee-name-label');
                                    if (nameLabel) {
                                      nameLabel.textContent = `Attendee: ${attendee.name}`;
                                      nameLabel.classList.remove('hidden');
                                    }
                                  } else {
                                    const nameLabel = document.getElementById('edit-attendee-name-label');
                                    if (nameLabel) {
                                      nameLabel.textContent = 'No attendee found with this bid number';
                                      nameLabel.classList.remove('hidden');
                                    }
                                  }
                                }}
                                className="w-full p-2 border rounded"
                                required
                              />
                              <div id="edit-attendee-name-label" className="mt-1 text-sm text-gray-600 hidden"></div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Amount
                              </label>
                              <input
                                type="number"
                                value={editBidAmount}
                                onChange={(e) => setEditBidAmount(parseFloat(e.target.value))}
                                step="0.01"
                                min="0"
                                className="w-full p-2 border rounded"
                                required
                              />
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={handleEditWinningBid}
                                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
                              >
                                Save Changes
                              </button>
                              <button
                                onClick={() => setIsEditingBid(false)}
                                className="flex-1 bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <form onSubmit={handleAddWinningBid} className="space-y-4">
                      <div className='flex space-x-4'>
                        <div className='flex-1'>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Bid Number
                          </label>
                          <input
                            type="text"
                            value={winningBidNum}
                            onChange={(e) => {
                              setWinningBidNum(e.target.value);
                              // Find attendee name as user types
                              const attendee = attendees.find(a => a.bidNum === e.target.value);
                              if (attendee) {
                                // Show attendee name in a small label below the input
                                const nameLabel = document.getElementById('attendee-name-label');
                                if (nameLabel) {
                                  nameLabel.textContent = `${attendee.name}`;
                                  nameLabel.classList.remove('hidden');
                                  nameLabel.classList.remove('text-red-600');
                                }
                              } else {
                                const nameLabel = document.getElementById('attendee-name-label');
                                if (nameLabel) {
                                  nameLabel.textContent = 'No attendee found with this bid number';
                                  nameLabel.classList.remove('hidden');
                                  nameLabel.classList.add('text-red-600');
                                }
                              }
                            }}
                            className="w-full p-2 border rounded"
                            required
                          />
                          <div id="attendee-name-label" className="mt-1 text-lg text-green-600 hidden font-bold"></div>
                        </div>
                        <div className='flex-1'>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Amount
                          </label>
                          <input
                            type="number"
                            value={winningBidAmount}
                            onChange={(e) => setWinningBidAmount(e.target.value)}
                            step="0.01"
                            min="0"
                            className="w-full p-2 border rounded"
                            required
                          />
                        </div>
                      </div>
                      <div className='flex'>
                        <button
                          type="submit"
                          className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 flex-none"
                        >
                          Record Winning Bid
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Lookup Attendee */}
          {activeTab === 'lookup-attendee' && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Lookup Attendee</h2>
              
              <div className="mb-6">
                <div className="mb-4">
                  <label className="block mb-1 font-medium">Filter Attendees by Bid #</label>
                  <input 
                    type="text" 
                    className="w-full p-2 border rounded"
                    placeholder="Enter bid number to filter"
                    value={searchAttendeeBidNum}
                    onChange={(e) => {
                      setSearchAttendeeBidNum(e.target.value);
                      // If the search term matches an attendee exactly, show their details
                      const exactMatch = attendees.find(att => att.bidNum === e.target.value);
                      if (exactMatch) {
                        setSearchedAttendee(exactMatch);
                        setSearchResults(items.filter(item => 
                          item.winningBid && item.winningBid.bidNum === exactMatch.bidNum
                        ));
                      } else {
                        setSearchedAttendee(null);
                        setSearchResults(null);
                      }
                    }}
                  />
                </div>
              </div>

              {/* Display all attendees */}
              <div className="mb-8">
                <h3 className="font-medium mb-2">All Attendees ({attendees.length})</h3>
                {attendees.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="p-2">Bid #</th>
                          <th className="p-2">Name</th>
                          <th className="p-2">Items Won</th>
                          <th className="p-2 text-right">Total Spent</th>
                          <th className="p-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attendees
                          .filter(attendee => 
                            !searchAttendeeBidNum || 
                            attendee.bidNum.includes(searchAttendeeBidNum)
                          )
                          .map((attendee) => (
                            <tr 
                              key={attendee.bidNum} 
                              className={`border-t cursor-pointer hover:bg-gray-50 ${
                                searchedAttendee?.bidNum === attendee.bidNum ? 'bg-blue-50' : ''
                              }`}
                              onClick={() => {
                                setSearchedAttendee(attendee);
                                setSearchResults(items.filter(item => 
                                  item.winningBid && item.winningBid.bidNum === attendee.bidNum
                                ));
                              }}
                            >
                              <td className="p-2">{attendee.bidNum}</td>
                              <td className="p-2">{attendee.name}</td>
                              <td className="p-2">{
                                items.filter(item => 
                                  item.winningBid && item.winningBid.bidNum === attendee.bidNum
                                ).length
                              }</td>
                              <td className="p-2 text-right">${calculateAttendeeTotal(attendee).toFixed(2)}</td>
                              <td className="p-2">
                                <div className="flex space-x-2">
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSearchedAttendee(attendee);
                                      setSearchResults(items.filter(item => 
                                        item.winningBid && item.winningBid.bidNum === attendee.bidNum
                                      ));
                                      setPrintMode(true);
                                      setTimeout(() => {
                                        window.print();
                                        setPrintMode(false);
                                      }, 100);
                                    }}
                                    className="text-blue-600 hover:text-blue-800 text-sm"
                                  >
                                    Print
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditAttendee(attendee);
                                    }}
                                    className="text-blue-600 hover:text-blue-800 text-sm"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteAttendee(attendee);
                                    }}
                                    className="text-red-600 hover:text-red-800 text-sm"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="italic text-gray-500">No attendees added yet</p>
                )}
              </div>
              
              {/* Display attendee details and won items */}
              {searchedAttendee && (
                <div className="border p-4 rounded">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-medium text-lg">Attendee Information</h3>
                    <div className="flex space-x-2">
                      <button 
                        onClick={handlePrint}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                      >
                        Print Receipt
                      </button>
                      <button
                        onClick={() => handleEditAttendee(searchedAttendee)}
                        className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                  
                  <p><strong>Name:</strong> {searchedAttendee.name}</p>
                  <p><strong>Bid #:</strong> {searchedAttendee.bidNum}</p>
                  
                  {/* Edit Attendee Form */}
                  {editingAttendee && editingAttendee.bidNum === searchedAttendee.bidNum && (
                    <div className="mt-4 p-4 bg-gray-50 rounded border">
                      <h4 className="font-medium mb-3">Edit Attendee</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Attendee Name
                          </label>
                          <input
                            type="text"
                            value={editAttendeeName}
                            onChange={(e) => setEditAttendeeName(e.target.value)}
                            className="w-full p-2 border rounded"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Bid Number
                          </label>
                          <input
                            type="text"
                            value={editAttendeeBidNum}
                            onChange={(e) => setEditAttendeeBidNum(e.target.value)}
                            className="w-full p-2 border rounded"
                            required
                          />
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={handleSaveAttendee}
                            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
                          >
                            Save Changes
                          </button>
                          <button
                            onClick={() => {
                              setEditingAttendee(null);
                              setEditAttendeeName('');
                              setEditAttendeeBidNum('');
                            }}
                            className="flex-1 bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <h3 className="font-medium mt-4 mb-2">Won Items</h3>
                  {searchResults && searchResults.length > 0 ? (
                    <div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="p-2">ID</th>
                              <th className="p-2">Name</th>
                              <th className="p-2">Section</th>
                              <th className="p-2 text-right">Bid Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {searchResults.map((item) => (
                              <tr key={item.id} className="border-t">
                                <td className="p-2">{item.id}</td>
                                <td className="p-2">{item.name}</td>
                                <td className="p-2">{item.section}</td>
                                <td className="p-2 text-right">${item.winningBid?.amount.toFixed(2) || '-'}</td>
                              </tr>
                            ))}
                            <tr className="border-t font-bold bg-gray-50">
                              <td className="p-2" colSpan={3}>Total</td>
                              <td className="p-2 text-right">${calculateAttendeeTotal(searchedAttendee).toFixed(2)}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <p className="italic text-gray-500">No items won yet</p>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* View All Data */}
          {activeTab === 'view-data' && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">View All Data</h2>
                <div className="flex space-x-4">
                  <button
                    onClick={handleExportAllData}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                  >
                    Export All Data
                  </button>
                  <button 
                    onClick={handleClearData}
                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                  >
                    Clear All Data
                  </button>
                </div>
              </div>
              
              {/* Items Table */}
              <h3 className="font-medium mb-2">All Items ({items.length})</h3>
              {items.length > 0 ? (
                <div className="overflow-x-auto mb-8">
                  <table className="w-full text-left">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="p-2">ID</th>
                        <th className="p-2">Name</th>
                        <th className="p-2">Section</th>
                        <th className="p-2">Winning Bid</th>
                        <th className="p-2">Winner</th>
                        <th className="p-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => (
                        <tr key={item.id} className="border-t">
                          <td className="p-2">{item.id}</td>
                          <td className="p-2">{item.name}</td>
                          <td className="p-2">{item.section}</td>
                          <td className="p-2 text-right">${item.winningBid?.amount.toFixed(2) || '-'}</td>
                          <td className="p-2">{
                            item.winningBid 
                              ? `${attendees.find(a => a.bidNum === item.winningBid?.bidNum)?.name || 'Unknown'} (#${item.winningBid?.bidNum})`
                              : '-'
                          }</td>
                          <td className="p-2">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEditItem(item)}
                                className="text-blue-600 hover:text-blue-800 text-sm"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteItem(item)}
                                className="text-red-600 hover:text-red-800 text-sm"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      <tr className="border-t font-bold bg-gray-50">
                        <td className="p-2" colSpan={3}>Total Revenue</td>
                        <td className="p-2 text-right">${items.reduce((total, item) => 
                          total + (item.winningBid?.amount || 0), 0).toFixed(2)
                        }</td>
                        <td className="p-2"></td>
                        <td className="p-2"></td>
                      </tr>
                    </tbody>
                  </table>
                  
                  {/* Edit Item Form */}
                  {editingItem && (
                    <div className="mt-4 p-4 bg-gray-50 rounded border">
                      <h4 className="font-medium mb-3">Edit Item</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Item Name
                          </label>
                          <input
                            type="text"
                            value={editItemName}
                            onChange={(e) => setEditItemName(e.target.value)}
                            className="w-full p-2 border rounded"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Item ID Number
                          </label>
                          <input
                            type="text"
                            value={editItemId}
                            onChange={(e) => setEditItemId(e.target.value)}
                            className="w-full p-2 border rounded"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Section (optional)
                          </label>
                          <input
                            type="text"
                            value={editItemSection}
                            onChange={(e) => setEditItemSection(e.target.value)}
                            className="w-full p-2 border rounded"
                          />
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={handleSaveItem}
                            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
                          >
                            Save Changes
                          </button>
                          <button
                            onClick={() => {
                              setEditingItem(null);
                              setEditItemName('');
                              setEditItemId('');
                              setEditItemSection('');
                            }}
                            className="flex-1 bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="italic text-gray-500 mb-8">No items added yet</p>
              )}
              
              {/* Attendees Table */}
              <h3 className="font-medium mb-2">All Attendees ({attendees.length})</h3>
              {attendees.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="p-2">Bid #</th>
                        <th className="p-2">Name</th>
                        <th className="p-2">Items Won</th>
                        <th className="p-2 text-right">Total Spent</th>
                        <th className="p-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendees.map((attendee) => (
                        <tr key={attendee.bidNum} className="border-t">
                          <td className="p-2">{attendee.bidNum}</td>
                          <td className="p-2">{attendee.name}</td>
                          <td className="p-2">{
                            items.filter(item => 
                              item.winningBid && item.winningBid.bidNum === attendee.bidNum
                            ).length
                          }</td>
                          <td className="p-2 text-right">${calculateAttendeeTotal(attendee).toFixed(2)}</td>
                          <td className="p-2">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEditAttendee(attendee)}
                                className="text-blue-600 hover:text-blue-800 text-sm"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteAttendee(attendee)}
                                className="text-red-600 hover:text-red-800 text-sm"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {/* Edit Attendee Form */}
                  {editingAttendee && (
                    <div className="mt-4 p-4 bg-gray-50 rounded border">
                      <h4 className="font-medium mb-3">Edit Attendee</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Attendee Name
                          </label>
                          <input
                            type="text"
                            value={editAttendeeName}
                            onChange={(e) => setEditAttendeeName(e.target.value)}
                            className="w-full p-2 border rounded"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Bid Number
                          </label>
                          <input
                            type="text"
                            value={editAttendeeBidNum}
                            onChange={(e) => setEditAttendeeBidNum(e.target.value)}
                            className="w-full p-2 border rounded"
                            required
                          />
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={handleSaveAttendee}
                            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
                          >
                            Save Changes
                          </button>
                          <button
                            onClick={() => {
                              setEditingAttendee(null);
                              setEditAttendeeName('');
                              setEditAttendeeBidNum('');
                            }}
                            className="flex-1 bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="italic text-gray-500">No attendees added yet</p>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Print-specific styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-only,
          .print-only * {
            visibility: visible;
          }
          .print-only {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background: white;
            margin: 0;
            padding: 20px;
          }
          @page {
            size: auto;
            margin: 20mm;
          }
        }
      `}</style>
    </div>
  );
} 