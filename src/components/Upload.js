import React from "react";

export default function Upload({onDataLoaded}) {
  const handleFileUpload=(e) => {
    const file=e.target.files[0];

    const reader=new FileReader();
    reader.onload=(event) => {
      const csv=event.target.result;
      const lines=csv.trim().split("\n");
      const headers=lines[0].split(",").map(header => header.trim());
      const data=lines.slice(1).map((line) => {
        const values=line.split(",");
        return headers.reduce((obj, header, i) => {
          obj[header]=i === 0 ? values[i] : +values[i];
          return obj;
        }, {});
      });
      onDataLoaded(data, file.name);
    };
    reader.readAsText(file);
  };

  return <input type="file" accept=".csv" onChange={handleFileUpload}/>;
}
