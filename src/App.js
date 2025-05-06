import React, { useState } from "react";
import Upload from "./components/Upload";
import Streamgraph from "./components/Streamgraph";
import Legend from "./components/Legend";
import "./App.css";

function App() {
  const [data, setData] = useState(null);

  const handleFileUpload = (data, name) => {
    setData(data);
  };

  return (
    <div className="App" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <h1>Upload a CSV file</h1>
      <div style={{ display: "flex", alignItems: "center", marginBottom: "20px" }}>
        <Upload onDataLoaded={(data, name) => handleFileUpload(data, name)} />      
      </div>
      {data && (
        <div style={{display: "flex", flexDirection: "row", alignItems: "flex-start", marginTop: "20px"}}>
          <div style={{flex: 1}}>
            <Streamgraph data={data}/>
          </div>
          <div style={{marginLeft: "20px"}}>
            <Legend/>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
