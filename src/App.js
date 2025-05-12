import { useState, useEffect } from 'react';
import LineGraph from "./components/LineGraph";
import BarGraph from './components/BarGraph';
import csvData from './data.csv';
import "./App.css";

function App() {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    fetch(csvData)
      .then(response => response.text())
      .then(responseText => {
        const parsedData = parseCsv(responseText);
        setData(parsedData);
      })
      .catch(error => console.error('Error fetching data:', error));
  }, []);

  const parseCsv = (csvText) => {
    const rows = csvText.trim().split('\n').filter(row => row);
    const headers = rows[0].split(',').map(header => header.trim());
    const result = rows.slice(1).map(row => {
      const values = row.split(',').map(value => value.trim());
      return headers.reduce((obj, header, index) => {
        obj[header] = values[index] || '';
        return obj;
      }, {});
    });
    return result;
  };
  
  return (
    <div className="App" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <LineGraph data={data}></LineGraph>
      <BarGraph data={data}></BarGraph>
    </div>
  );
}

export default App;
