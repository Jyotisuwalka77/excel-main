// ExcelFilter.jsx
import { useState } from 'react';
import * as XLSX from 'xlsx';
import './App.css';

export default function App() {
  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [filterValues, setFilterValues] = useState({});
  const [filteredData, setFilteredData] = useState([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [columnTypes, setColumnTypes] = useState({});

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        // Parse the Excel file with dates
        const workbook = XLSX.read(event.target.result, { type: 'binary', cellDates: true });
        const worksheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[worksheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false });
        
        if (jsonData.length === 0) {
          alert("The Excel file appears to be empty.");
          return;
        }
        
        // Determine column types (identify date columns)
        const types = {};
        const firstRow = jsonData[0];
        
        Object.keys(firstRow).forEach(column => {
          // Check if this column might contain dates
          const sampleValue = firstRow[column];
          if (sampleValue && typeof sampleValue === 'string') {
            // Check if it matches date patterns
            if (
              /^\d{2}[-/]\d{2}[-/]\d{4}$/.test(sampleValue) || // DD-MM-YYYY or DD/MM/YYYY
              /^\d{4}[-/]\d{2}[-/]\d{2}$/.test(sampleValue) || // YYYY-MM-DD or YYYY/MM/DD
              /^\d{1,2}[-/]\d{1,2}[-/]\d{2,4}$/.test(sampleValue) // Any common date format
            ) {
              types[column] = 'date';
            } else {
              types[column] = 'text';
            }
          } else {
            types[column] = typeof sampleValue;
          }
        });
        
        setColumnTypes(types);
        setData(jsonData);
        setFilteredData(jsonData);
        setColumns(Object.keys(firstRow));
        setIsDataLoaded(true);
        
        // Initialize filter values
        const initialFilterValues = {};
        Object.keys(firstRow).forEach(column => {
          initialFilterValues[column] = '';
        });
        setFilterValues(initialFilterValues);
      } catch (error) {
        alert("Error processing the file: " + error.message);
      }
    };
    
    reader.readAsBinaryString(file);
  };

  const handleFilterChange = (column, value) => {
    const newFilterValues = {
      ...filterValues,
      [column]: value
    };
    setFilterValues(newFilterValues);
    
    // Apply filtering
    const newFilteredData = data.filter(row => {
      return Object.keys(newFilterValues).every(column => {
        const filterValue = newFilterValues[column].toString().toLowerCase();
        if (!filterValue) return true; // Skip empty filters
        
        let cellValue = row[column];
        if (cellValue === undefined || cellValue === null) return false;
        
        // Convert to string and lowercase for comparison
        cellValue = cellValue.toString().toLowerCase();
        return cellValue.includes(filterValue);
      });
    });
    
    setFilteredData(newFilteredData);
  };

  // Format cell value for display
  const formatCellValue = (value, column) => {
    if (value === undefined || value === null) return '';
    
    // Handle date formatting
    if (typeof value === 'string' && columnTypes[column] === 'date') {
      // If it's already a correctly formatted date string, return it
      return value;
    }
    
    // Regular string formatting
    return value.toString();
  };

  return (
    <div className="container">
      <h1 className="main-title">Excel Data Filter</h1>
      
      <div className="upload-section">
        <div className="upload-container">
          <label className="upload-button">
            <span>Upload Excel File</span>
            <input 
              type="file" 
              accept=".xlsx, .xls" 
              onChange={handleFileUpload} 
              className="hidden-input"
            />
          </label>
        </div>
        {isDataLoaded && (
          <p className="success-message">
            Data loaded successfully! ({data.length} rows)
          </p>
        )}
      </div>

      {isDataLoaded && (
        <>
          <div className="filter-section">
            <h2 className="section-title">Filter Data</h2>
            <div className="filter-grid">
              {columns.map(column => (
                <div key={column} className="filter-item">
                  <label className="filter-label">{column}</label>
                  <input
                    type="text"
                    value={filterValues[column]}
                    onChange={(e) => handleFilterChange(column, e.target.value)}
                    placeholder={`Filter by ${column}...`}
                    className="filter-input"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  {columns.map(column => (
                    <th key={column} className="table-header">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredData.length > 0 ? (
                  filteredData.map((row, rowIndex) => (
                    <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'row-even' : 'row-odd'}>
                      {columns.map(column => (
                        <td key={`${rowIndex}-${column}`} className="table-cell">
                          {formatCellValue(row[column], column)}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={columns.length} className="empty-message">
                      No matching data found. Try adjusting your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <div className="results-count">
            Showing {filteredData.length} of {data.length} rows
          </div>
        </>
      )}
    </div>
  );
}