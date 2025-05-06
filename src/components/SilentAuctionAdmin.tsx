import { useState, useEffect } from 'react';

interface Item {
  id: string;
  name: string;
  section: string;
  winningBid: {
    bidNum: string;
    amount: number;
  } | null;
}

interface Attendee {
  name: string;
  bidNum: string;
  wonItems: string[];
}

export default function SilentAuctionAdmin() {
  // State for auction items
  const [items, setItems] = useState<Item[]>([]);
  
  // State for attendees
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  
  // States for form inputs
  const [itemName, setItemName] = useState('');
  const [itemId, setItemId] = useState('');
  const [itemSection, setItemSection] = useState('');
  const [searchItemId, setSearchItemId] = useState('');
  const [searchAttendeeBidNum, setSearchAttendeeBidNum] = useState('');
  const [attendeeName, setAttendeeName] = useState('');
  const [attendeeBidNum, setAttendeeBidNum] = useState('');
  const [winningBidNum, setWinningBidNum] = useState('');
  const [winningBidAmount, setWinningBidAmount] = useState<number>(0);
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
  
  // Add state for sorting
  const [sortBy, setSortBy] = useState<'id' | 'name' | 'section' | 'status'>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Load initial data from localStorage if available
  useEffect(() => {
    const savedItems = localStorage.getItem('auctionItems');
    const savedAttendees = localStorage.getItem('auctionAttendees');
    
    if (savedItems) setItems(JSON.parse(savedItems));
    if (savedAttendees) setAttendees(JSON.parse(savedAttendees));
  }, []);
  
  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('auctionItems', JSON.stringify(items));
  }, [items]);
  
  useEffect(() => {
    localStorage.setItem('auctionAttendees', JSON.stringify(attendees));
  }, [attendees]);
  
  // Add new auction item
  const handleAddItem = () => {
    if (!itemName || !itemId || !itemSection) {
      alert('Please fill in all fields');
      return;
    }
    
    // Check if ID already exists
    if (items.some(item => item.id === itemId)) {
      alert(`Item ID ${itemId} already exists`);
      return;
    }
    
    const newItem = {
      name: itemName,
      id: itemId,
      section: itemSection,
      winningBid: null
    };
    
    setItems([...items, newItem]);
    
    // Clear form
    setItemName('');
    setItemId('');
    setItemSection('');
  };
  
  // Add new attendee
  const handleAddAttendee = () => {
    if (!attendeeName || !attendeeBidNum) {
      alert('Please fill in all fields');
      return;
    }
    
    // Check if bid number already exists
    if (attendees.some(attendee => attendee.bidNum === attendeeBidNum)) {
      alert(`Bid # ${attendeeBidNum} already assigned`);
      return;
    }
    
    const newAttendee = {
      name: attendeeName,
      bidNum: attendeeBidNum,
      wonItems: []
    };
    
    setAttendees([...attendees, newAttendee]);
    
    // Clear form
    setAttendeeName('');
    setAttendeeBidNum('');
  };
  
  // Search for item by ID
  const handleSearchItem = () => {
    if (!searchItemId) {
      alert('Please enter an item ID');
      return;
    }
    
    const item = items.find(item => item.id === searchItemId);
    
    if (!item) {
      alert(`No item found with ID ${searchItemId}`);
      return;
    }
    
    setSearchedItem(item);
    setSearchResults(null);
    setSearchedAttendee(null);
  };
  
  // Add winning bid to item
  const handleAddWinningBid = () => {
    if (!winningBidNum || !winningBidAmount || !searchedItem) {
      alert('Please fill in all fields');
      return;
    }
    
    const bidAmount = parseFloat(winningBidAmount.toString());
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
    
    // Update the item
    const updatedItems = items.map(item => {
      if (item.id === searchedItem.id) {
        return {
          ...item,
          winningBid: {
            bidNum: winningBidNum,
            amount: bidAmount
          }
        };
      }
      return item;
    });
    
    // Update the attendee's won items
    const updatedAttendees = attendees.map(att => {
      if (att.bidNum === winningBidNum) {
        return {
          ...att,
          wonItems: [...att.wonItems.filter(id => id !== searchedItem.id), searchedItem.id]
        };
      }
      return att;
    });
    
    setItems(updatedItems);
    setAttendees(updatedAttendees);
    
    // Update the searched item
    setSearchedItem({
      ...searchedItem,
      winningBid: {
        bidNum: winningBidNum,
        amount: bidAmount
      }
    });
    
    // Clear form
    setWinningBidNum('');
    setWinningBidAmount(0);
  };
  
  // Search for attendee
  const handleSearchAttendee = () => {
    if (!searchAttendeeBidNum) {
      alert('Please enter a bid number');
      return;
    }
    
    const attendee = attendees.find(att => att.bidNum === searchAttendeeBidNum);
    
    if (!attendee) {
      alert(`No attendee found with Bid # ${searchAttendeeBidNum}`);
      return;
    }
    
    // Find all items won by this attendee
    const wonItems = items.filter(item => 
      item.winningBid && item.winningBid.bidNum === attendee.bidNum
    );
    
    setSearchedAttendee(attendee);
    setSearchResults(wonItems);
    setSearchedItem(null);
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
  const handleClearData = () => {
    if (window.confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      setItems([]);
      setAttendees([]);
      setSearchedItem(null);
      setSearchResults(null);
      setSearchedAttendee(null);
      localStorage.removeItem('auctionItems');
      localStorage.removeItem('auctionAttendees');
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
  const handleEditWinningBid = () => {
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

    // Update the item
    const updatedItems = items.map(item => {
      if (item.id === searchedItem.id) {
        return {
          ...item,
          winningBid: {
            bidNum: editBidNum,
            amount: bidAmount
          }
        };
      }
      return item;
    });

    setItems(updatedItems);
    setSearchedItem({
      ...searchedItem,
      winningBid: {
        bidNum: editBidNum,
        amount: bidAmount
      }
    });
    setIsEditingBid(false);
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

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Print Mode */}
      {printMode && searchedAttendee && searchResults && (
        <div className="p-8 bg-white">
          <h1 className="text-3xl font-bold mb-6">Silent Auction Receipt</h1>
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
              <div>
                <div className="mb-4">
                  <label className="block mb-1 font-medium">Item Name</label>
                  <input 
                    type="text" 
                    className="w-full p-2 border rounded"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, handleAddItem)}
                  />
                </div>
                <div className="mb-4">
                  <label className="block mb-1 font-medium">Item ID Number</label>
                  <input 
                    type="text" 
                    className="w-full p-2 border rounded"
                    placeholder="e.g. 001, 002, 003"
                    value={itemId}
                    onChange={(e) => setItemId(e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, handleAddItem)}
                  />
                </div>
                <div className="mb-4">
                  <label className="block mb-1 font-medium">Section</label>
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
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
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
                        </tr>
                      </thead>
                      <tbody>
                        {items.slice(-5).map((item) => (
                          <tr key={item.id} className="border-t">
                            <td className="p-2">{item.id}</td>
                            <td className="p-2">{item.name}</td>
                            <td className="p-2">{item.section}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
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
                        </tr>
                      </thead>
                      <tbody>
                        {attendees.slice(-5).map((attendee) => (
                          <tr key={attendee.bidNum} className="border-t">
                            <td className="p-2">{attendee.bidNum}</td>
                            <td className="p-2">{attendee.name}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
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
                          <p className="font-medium">Winning Bid Already Recorded</p>
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
                      <div>
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
                                nameLabel.textContent = `Attendee: ${attendee.name}`;
                                nameLabel.classList.remove('hidden');
                              }
                            } else {
                              const nameLabel = document.getElementById('attendee-name-label');
                              if (nameLabel) {
                                nameLabel.textContent = 'No attendee found with this bid number';
                                nameLabel.classList.remove('hidden');
                              }
                            }
                          }}
                          className="w-full p-2 border rounded"
                          required
                        />
                        <div id="attendee-name-label" className="mt-1 text-sm text-gray-600 hidden"></div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Amount
                        </label>
                        <input
                          type="number"
                          value={winningBidAmount}
                          onChange={(e) => setWinningBidAmount(parseFloat(e.target.value))}
                          step="0.01"
                          min="0"
                          className="w-full p-2 border rounded"
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
                      >
                        Record Winning Bid
                      </button>
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
                          <th className="p-2"></th>
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
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  Print
                                </button>
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
                    <button 
                      onClick={handlePrint}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                    >
                      Print Receipt
                    </button>
                  </div>
                  
                  <p><strong>Name:</strong> {searchedAttendee.name}</p>
                  <p><strong>Bid #:</strong> {searchedAttendee.bidNum}</p>
                  
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
                        </tr>
                      ))}
                      <tr className="border-t font-bold bg-gray-50">
                        <td className="p-2" colSpan={3}>Total Revenue</td>
                        <td className="p-2 text-right">${items.reduce((total, item) => 
                          total + (item.winningBid?.amount || 0), 0).toFixed(2)
                        }</td>
                        <td className="p-2"></td>
                      </tr>
                    </tbody>
                  </table>
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
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
          .print-mode, .print-mode * {
            visibility: visible;
          }
          .print-mode {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
} 