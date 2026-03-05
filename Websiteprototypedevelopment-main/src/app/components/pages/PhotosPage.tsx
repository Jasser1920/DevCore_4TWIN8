import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Camera, Upload, CheckCircle, AlertTriangle, Calendar } from 'lucide-react';
import { mockSites } from '../../data/mockData';

interface Photo {
  id: string;
  siteId: string;
  siteName: string;
  url: string;
  uploadedAt: string;
  aiAnalyzed: boolean;
  progress?: number;
  safetyIssues?: string[];
  ppeCompliance?: boolean;
}

export const PhotosPage: React.FC = () => {
  const [uploading, setUploading] = useState(false);

  // Mock photo data with Unsplash image URLs
  const [photos] = useState<Photo[]>([
    {
      id: '1',
      siteId: '2',
      siteName: 'Harbor Point - Floors 1-10',
      url: 'https://images.unsplash.com/photo-1634586657092-438d8f1560ae?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb25zdHJ1Y3Rpb24lMjBzaXRlJTIwcHJvZ3Jlc3MlMjBidWlsZGluZ3xlbnwxfHx8fDE3NzA3MDM4MDl8MA&ixlib=rb-4.1.0&q=80&w=1080',
      uploadedAt: '2026-02-10T09:30:00',
      aiAnalyzed: true,
      progress: 78,
      safetyIssues: [],
      ppeCompliance: true,
    },
    {
      id: '2',
      siteId: '3',
      siteName: 'Harbor Point - Floors 11-20',
      url: 'https://images.unsplash.com/photo-1552879890-3a06dd3a06c2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb25zdHJ1Y3Rpb24lMjB3b3JrZXJzJTIwc2FmZXR5JTIwaGVsbWV0c3xlbnwxfHx8fDE3NzA3MTMzMzF8MA&ixlib=rb-4.1.0&q=80&w=1080',
      uploadedAt: '2026-02-10T10:15:00',
      aiAnalyzed: true,
      progress: 45,
      safetyIssues: ['Missing safety barriers visible'],
      ppeCompliance: false,
    },
    {
      id: '3',
      siteId: '5',
      siteName: 'Riverside - Foundation',
      url: 'https://images.unsplash.com/photo-1630259970029-7b1e1160243e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidWlsZGluZyUyMGZvdW5kYXRpb24lMjBjb25zdHJ1Y3Rpb258ZW58MXx8fHwxNzcwNjM0MDc2fDA&ixlib=rb-4.1.0&q=80&w=1080',
      uploadedAt: '2026-02-10T11:00:00',
      aiAnalyzed: true,
      progress: 62,
      safetyIssues: ['Workers without helmets detected', 'Scaffolding concerns'],
      ppeCompliance: false,
    },
    {
      id: '4',
      siteId: '2',
      siteName: 'Harbor Point - Floors 1-10',
      url: 'https://images.unsplash.com/photo-1693679758394-6d56a1e5c1a0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBidWlsZGluZyUyMGNvbnN0cnVjdGlvbiUyMHNpdGV8ZW58MXx8fHwxNzcwNzMxOTA1fDA&ixlib=rb-4.1.0&q=80&w=1080',
      uploadedAt: '2026-02-09T14:20:00',
      aiAnalyzed: true,
      progress: 75,
      safetyIssues: [],
      ppeCompliance: true,
    },
  ]);

  const handleUpload = () => {
    setUploading(true);
    // Mock upload process
    setTimeout(() => {
      setUploading(false);
      alert('Photos uploaded successfully! AI analysis in progress...');
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2>Site Photos & AI Analysis</h2>
          <p className="text-sm text-gray-500 mt-1">
            Upload daily site photos for automated progress tracking and safety analysis
          </p>
        </div>
        <Button
          onClick={handleUpload}
          disabled={uploading}
          className="bg-[#075B7A] hover:bg-[#064d66]"
        >
          <Upload className="h-4 w-4 mr-2" />
          {uploading ? 'Uploading...' : 'Upload Photos'}
        </Button>
      </div>

      {/* Upload Instructions */}
      <Card className="bg-gradient-to-r from-[#CAEDF1] to-[#62DEF1]/30 border-[#148ABB]">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 bg-[#075B7A] rounded-lg flex items-center justify-center flex-shrink-0">
              <Camera className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-[#075B7A] mb-2">AI-Powered Photo Analysis</h3>
              <p className="text-sm text-gray-700 mb-2">
                Upload photos and our AI will automatically analyze:
              </p>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Construction progress and completion percentage</li>
                <li>• PPE compliance (helmets, vests, safety gear)</li>
                <li>• Safety hazards and equipment issues</li>
                <li>• Quality control and compliance verification</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Photo Gallery */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {photos.map((photo) => (
          <Card key={photo.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">{photo.siteName}</CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(photo.uploadedAt).toLocaleString()}
                  </CardDescription>
                </div>
                {photo.aiAnalyzed && (
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                    AI Analyzed
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Photo */}
              <div className="aspect-video bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg overflow-hidden">
                <img
                  src={photo.url}
                  alt={photo.siteName}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* AI Analysis Results */}
              {photo.aiAnalyzed && (
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-600">Progress Detected</span>
                      <span className="text-[#075B7A]">{photo.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-[#075B7A] h-2 rounded-full"
                        style={{ width: `${photo.progress}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* PPE Compliance */}
                  <div
                    className={`flex items-center gap-2 p-3 rounded-lg ${
                      photo.ppeCompliance
                        ? 'bg-green-50 border border-green-200'
                        : 'bg-red-50 border border-red-200'
                    }`}
                  >
                    {photo.ppeCompliance ? (
                      <>
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="text-sm text-green-700">PPE Compliance Verified</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                        <span className="text-sm text-red-700">PPE Compliance Issues</span>
                      </>
                    )}
                  </div>

                  {/* Safety Issues */}
                  {photo.safetyIssues && photo.safetyIssues.length > 0 && (
                    <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <div className="flex items-start gap-2 mb-2">
                        <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                        <span className="text-sm text-orange-700">Safety Issues Detected</span>
                      </div>
                      <ul className="space-y-1 ml-7">
                        {photo.safetyIssues.map((issue, idx) => (
                          <li key={idx} className="text-sm text-orange-600">
                            • {issue}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <Button variant="outline" className="w-full">
                View Full Analysis
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
