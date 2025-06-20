import React, { useState } from 'react';
import "./App.css"
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { toast } from 'react-toastify';

// Make sure you import XLSX if you're using it as a module
// If you're loading it globally via a script tag, you might not need this.
// For a modern React setup (e.g., Vite, Create React App), it's usually imported.

const BACKEND_BASE_URL = import.meta.env.VITE_APP_BACKEND_URL || 'http://localhost:5000';

// Main App component for the user information form
const App = () => {
  // State variables to store form input values
  const [organization, setOrganization] = useState('');
  const [userName, setUserName] = useState('');
  const [contact, setContact] = useState('');
  const [inviteeName, setInviteeName] = useState('');
  const [inviteeNumber, setInviteeNumber] = useState('');
  // State for bulk uploaded contacts
  const [otherContacts, setOtherContacts] = useState([]);
  const [fileError, setFileError] = useState('');
  // New state to manage the contact input mode: 'initial', 'single', or 'bulk'
  const [contactMode, setContactMode] = useState('initial');
  // New state for loading indicator
  const [loading, setLoading] = useState(false); // <--- New state variable

  // Sample organization names for the dropdown
  const organizations = [
    'Select your Church', // Default disabled option
    'Christ Embassy Sakaman',
    'Christ Embassy Sowutuom',
    'Christ Embassy Mallam',
    'Christ Embassy Mataheko',
    'Christ Embassy Video City',
    "Others"
  ];

  // Handler for file upload
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) {
      setFileError('No file selected.');
      setOtherContacts([]);
      return;
    }

    const validFileTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx MIME type
      'application/vnd.ms-excel' // .xls MIME type (older Excel, usually handled too)
    ];
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls') && !validFileTypes.includes(file.type)) {
      setFileError('Please upload an Excel (.xlsx or .xls) file.');
      setOtherContacts([]);
      return;
    }

    setFileError(''); // Clear any previous errors

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        const jsonContacts = XLSX.utils.sheet_to_json(worksheet);

        const parsedContacts = jsonContacts.map(row => {
          const nameKey = Object.keys(row).find(key => key.toLowerCase() === 'name');
          const numberKey = Object.keys(row).find(key => key.toLowerCase() === 'number');

          const name = nameKey ? String(row[nameKey]).trim() : '';
          const number = numberKey ? String(row[numberKey]).trim() : '';

          if (name && number) {
            return { name, number };
          }
          return null;
        }).filter(Boolean);

        if (parsedContacts.length > 0) {
          setOtherContacts(parsedContacts);
        } else {
          setFileError('No valid contacts found in the Excel file. Please ensure columns "name" and "number" exist and have data.');
          setOtherContacts([]);
        }

      } catch (error) {
        console.error("Error reading or parsing Excel file:", error);
        setFileError('Error reading or parsing file. Please ensure it is a valid Excel file with "name" and "number" columns.');
        setOtherContacts([]);
      }
    };

    reader.onerror = () => {
      setFileError('Failed to read file.');
      setOtherContacts([]);
    };

    reader.readAsArrayBuffer(file);
  };

  // Handler for form submission
  const handleSubmit = async (e) => { // <--- Made function async
    e.preventDefault();

    // Input validation before showing loader
    if (!validateContact(contact)){
      return toast.warning("Kindly enter a valid Ghanaian number for your contact.")
    }

    if (contactMode === 'single' && !validateContact(inviteeNumber)){
      return toast.warning("Kindly enter a valid Ghanaian number for invitee's contact.")
    }

    // Check for bulk contacts if in bulk mode
    if (contactMode === 'bulk' && otherContacts.length === 0) {
      // You might want to allow submission if the user is just registering themselves
      // or ensure that a file has been uploaded if bulk is selected.
      // For now, if bulk mode is selected, expect contacts.
      if (!fileError && otherContacts.length === 0) { // If no file error, but no contacts found
         return toast.warning("Please upload a valid Excel file with contacts for bulk submission.");
      } else if (fileError) { // If there was a file error
          return toast.warning(fileError);
      }
    }


    setLoading(true); // <--- Set loading to true when submission starts

    const formData = {
      organization,
      userName,
      contact,
      contactMode, // <--- Send contactMode to the backend
    };

    if (contactMode === 'single') {
      formData.inviteeName = inviteeName;
      formData.inviteeNumber = inviteeNumber;
    } else if (contactMode === 'bulk') {
      formData.otherContacts = otherContacts;
    }

    try {
      const response = await fetch(`${BACKEND_BASE_URL}/submitFormData`, { // Corrected endpoint
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.status === 204) {
        console.log('Success: Server returned 204 No Content.');
        toast.success('Submitted successfully!');
      } else if (response.ok) {
        const data = await response.json();
        console.log('Success:', data);
        toast.success('Submitted successfully!');
      } else {
        const errorData = await response.json().catch(() => ({ message: `Server responded with status: ${response.status}` }));
        throw new Error(errorData.message || `Server responded with status: ${response.status}`);
      }

      // Optionally, reset the form fields after successful submission
      setOrganization('');
      setUserName('');
      setContact('');
      setInviteeName('');
      setInviteeNumber('');
      setOtherContacts([]);
      setContactMode('initial');

    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error(`Failed to submit form: ${error.message}`);
    } finally {
      setLoading(false); // <--- Set loading to false when submission finishes (success or failure)
    }
  };

  function validateContact(input) {
    const regex = /^0\d{9}$/;
    return regex.test(input);
  }

  return (
    <>
      <div className="container">
        <div className="form-card">
          <div className='logo'>
            {/* <img src="src\assets\loveworld.png"/> */}
            {/* <div style={{backgroundColor:"black", width:"10px", height:"10px", borderRadius:"50%"}}></div> */}
            {/* <p>Mataheko Group</p> */}
          </div>
          <h2 className="form-title">User Registration Form</h2>

          <form onSubmit={handleSubmit}>
            {/* Organization Name Dropdown */}
            <div className="form-group">
              <label htmlFor="organization" className="form-label">
                Church
              </label>
              <select
                id="organization"
                name="organization"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                className="form-select"
                required
              >
                {organizations.map((org, index) => (
                  <option key={index} value={org === 'Select your Church' ? '' : org} disabled={org === 'Select your Church'}>
                    {org}
                  </option>
                ))}
              </select>
            </div>

            {/* User Name Input */}
            <div className="form-group">
              <label htmlFor="userName" className="form-label">
                Your Name
              </label>
              <input
                type="text"
                id="userName"
                name="userName"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="form-input"
                placeholder="e.g., John Mensah"
                required
              />
            </div>

            {/* Contact Input */}
            <div className="form-group">
              <label htmlFor="contact" className="form-label">
                Your Contact
              </label>
              <input
                type="number"
                id="contact"
                name="contact"
                value={contact}
                onChange={(e) => {
                  setContact(e.target.value)
                }}
                className="form-input"
                placeholder="e.g., 0244123223"
                required
              />
            </div>

            {/* Conditional Rendering based on contactMode */}
            {contactMode === 'initial' && (
              <div className="mode-button-container">
                <button
                  type="button"
                  onClick={() => setContactMode('single')}
                  className="mode-button"
                  style={{ backgroundColor:"white", borderColor:"black", color:"black" }}
                >
                  Add Single
                </button>
                <button
                  type="button"
                  onClick={() => setContactMode('bulk')}
                  className="mode-button"
                  style={{ backgroundColor: 'black', color:"white" }}
                >
                  Bulk
                </button>
              </div>
            )}

            {contactMode === 'single' && (
              <>
                <div className="form-group">
                  <label htmlFor="inviteeName" className="form-label">
                    Invitee's Name
                  </label>
                  <input
                    type="text"
                    id="inviteeName"
                    name="inviteeName"
                    value={inviteeName}
                    onChange={(e) => setInviteeName(e.target.value)}
                    className="form-input"
                    placeholder="e.g., Akua Ankomah"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="inviteeNumber" className="form-label">
                    Invitee's Contact
                  </label>
                  <input
                    type="number"
                    id="inviteeNumber"
                    name="inviteeNumber"
                    value={inviteeNumber}
                    onChange={(e) => setInviteeNumber(e.target.value)}
                    className="form-input"
                    placeholder="e.g., 0549098897"
                    required
                  />
                </div>
              </>
            )}

            {contactMode === 'bulk' && (
              <div className="form-group">
                <label htmlFor="otherContactsFile" className="form-label">
                  Upload Other Contacts (Excel .xlsx or .xls)
                </label>
                <input
                  type="file"
                  id="otherContactsFile"
                  name="otherContactsFile"
                  accept=".xlsx, .xls" // Updated accept attribute
                  onChange={handleFileUpload}
                  className="form-file-input"
                />
                {fileError && <p className="error-message">{fileError}</p>}
              </div>
            )}

            {/* Submit Button with loader */}
            {contactMode !== 'initial' && (
              <div className="form-group" style={{ marginTop: '2rem' }}>
                <button
                  type="submit"
                  className="submit-button"
                  disabled={loading} // <--- Disable button when loading
                >
                  {loading ? (
                    <div className="loader"></div> // <--- Loader component
                  ) : (
                    'Submit'
                  )}
                </button>
              </div>
            )}
          </form>
        </div>
        <div className="background-right"></div>
      </div>
      <ToastContainer />
    </>
  );
};

export default App;