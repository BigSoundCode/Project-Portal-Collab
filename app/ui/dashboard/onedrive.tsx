'use client'

import React, { useEffect, useState } from 'react';


const OneDrive: React.FC = () => {
    const [files, setFiles] = useState([]);

    useEffect(() => {
        // Function to fetch OneDrive files
        const fetchFiles = async () => {
            try {
                // Make API call to fetch files from OneDrive
                const response = await fetch('https://api.onedrive.com/files');
                const data = await response.json();
                setFiles(data);
            } catch (error) {
                console.error('Error fetching OneDrive files:', error);
            }
        };

        // Call the fetchFiles function
        fetchFiles();
    }, []);

    return (
        <div>
            <h1>OneDrive Files</h1>
            <ul>
                {files && Array.isArray(files) && files.map((file: any) => (
                    <li key={file.id}>{file.name}</li>
                ))}
            </ul>
        </div>
    );
};

export default OneDrive;