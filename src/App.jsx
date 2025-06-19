import React, { useState } from 'react';
import "./App.css"
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { toast } from 'react-toastify';


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

    // Updated file type validation for .xlsx
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
        // Read the file as an ArrayBuffer for SheetJS
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' }); // Use XLSX from the global scope

        // Get the first sheet name
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convert worksheet to JSON array.
        // By default, sheet_to_json will use the first row as headers.
        const jsonContacts = XLSX.utils.sheet_to_json(worksheet);

        // Validate and format the extracted contacts
        const parsedContacts = jsonContacts.map(row => {
          // Assuming the columns are named 'name' and 'number' (case-insensitive check for robustness)
          const nameKey = Object.keys(row).find(key => key.toLowerCase() === 'name');
          const numberKey = Object.keys(row).find(key => key.toLowerCase() === 'number');

          const name = nameKey ? String(row[nameKey]).trim() : '';
          const number = numberKey ? String(row[numberKey]).trim() : '';

          if (name && number) {
            return { name, number };
          }
          return null; // Return null for invalid rows
        }).filter(Boolean); // Filter out any nulls (rows without valid name/number)

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

    // Read the file content as an ArrayBuffer
    reader.readAsArrayBuffer(file);
  };

  // Handler for form submission
  const handleSubmit = (e) => {
    e.preventDefault(); // Prevent default form submission behavior

    const formData = {
      organization,
      userName,
      contact,
    };

    if (!validateContact(contact)){
      return toast.warning("Kindly enter a valid Ghanaian number")
    }

    if (contactMode === 'single') {
      formData.inviteeName = inviteeName;
      formData.inviteeNumber = inviteeNumber;
      if (!validateContact(inviteeNumber)){
      return toast.warning("Kindly enter a valid Ghanaian number")
    }
    } else if (contactMode === 'bulk') {
      formData.otherContacts = otherContacts;
    }

    // Log all form data to the console
    // console.log(formData);

       // In a real application, you would send this formData to your Node.js backend:
    fetch(`${BACKEND_BASE_URL}/data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    })
    .then(response => response.json())
    .then(data => {
      console.log('Success:', data);
     toast.success('Submitted successfully!');
      // Optionally clear form or show success message
    })
    .catch((error) => {
      console.error('Error submitting form:', error);
      toast.error('Failed to submit form. See console for details.');
    });

    // You can add further logic here, such as sending data to a server
    // For now, we'll just show a simple alert or log confirmation
    

    // Optionally, reset the form fields after submission
    setOrganization('');
    setUserName('');
    setContact('');
    setInviteeName('');
    setInviteeNumber('');
    setOtherContacts([]);
    setContactMode('initial'); // Reset mode
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
                // onBlur={handleBlur}
                name="contact"
                value={contact}
                onChange={(e) => {
                  // if(validateContact(e.target.value)){
                    setContact(e.target.value)
                  // }
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
                {/* Father's Name Input */}
                <div className="form-group">
                  <label htmlFor="inviteeName" className="form-label">
                    Invite's Name
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

                {/* Father's Contact Input */}
                <div className="form-group">
                  <label htmlFor="inviteeNumber" className="form-label">
                    Invite's Contact
                  </label>
                  <input
                    type="number"
                    id="inviteeNumber"
                    name="inviteeNumber"
                    // onBlur={handleBlur}
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
                  Upload Other Contacts (CSV)
                </label>
                <input
                  type="file"
                  id="otherContactsFile"
                  name="otherContactsFile"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="form-file-input"
                />
                {fileError && <p className="error-message">{fileError}</p>}

                {/* {otherContacts.length > 0 && (
                  <div className="contact-list-container">
                    <p className="form-label">Contacts from file:</p>
                    <ul className="contact-list">
                      {otherContacts.map((c, index) => (
                        <li key={index} className="contact-list-item">
                          <span className="contact-name">{c.name}</span>
                          <span className="contact-number">{c.number}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )} */}
              </div>
            )}

            {/* Submit Button (only show if a mode has been selected) */}
            {contactMode !== 'initial' && (
              <div className="form-group" style={{ marginTop: '2rem' }}>
                <button
                  type="submit"
                  className="submit-button"
                >
                  Submit
                </button>
              </div>
            )}
          </form>
        </div>
        {/* New div for the background image on the right for larger screens */}
        <div className="background-right"></div>
      </div>
      <ToastContainer />
    </>
  );
};

export default App;
