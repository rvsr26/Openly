"use client";

import { useEffect, useState } from "react";
import api from "@/app/lib/api";
import { DataGrid, GridColDef, GridActionsCellItem } from "@mui/x-data-grid";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import {
    Button, TextField, Dialog, DialogActions, DialogContent,
    DialogTitle, Select, MenuItem, FormControl, InputLabel,
    FormControlLabel, Switch, Box, Typography
} from "@mui/material";
import { Edit2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

const darkTheme = createTheme({
    palette: {
        mode: "dark",
        primary: { main: "#ef4444" }, // red for reports
        background: { default: "#000000", paper: "#111111" }
    },
});

export default function AdminReports() {
    const { user: currentUser } = useAuth();
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchId, setSearchId] = useState("");

    // Dialog States
    const [formOpen, setFormOpen] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        title: "", type: "Spam", severity: 3,
        assigned_to: "", notes: "", action: "Pending Review", is_urgent: false,
        target_id: "", target_type: "post"
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get("/api/v1/admin/reports");
            setRows(res.data);
        } catch {
            toast.error("Failed to fetch reports");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleSearch = async () => {
        if (!searchId.trim()) {
            fetchData();
            return;
        }
        setLoading(true);
        try {
            const res = await api.get(`/api/v1/admin/reports/search/${searchId}`);
            setRows([res.data] as any);
            toast.success("Record found");
        } catch {
            toast.error("Report Case not found");
            setRows([]);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenForm = (doc?: any) => {
        if (doc) {
            setSelectedId(doc.id);
            setFormData({
                title: doc.title, type: doc.type, severity: doc.severity,
                assigned_to: doc.assigned_to, notes: doc.notes,
                action: doc.action, is_urgent: doc.is_urgent,
                target_id: doc.target_id || "", 
                target_type: doc.target_type || "post"
            });
        } else {
            setSelectedId(null);
            setFormData({
                title: "", type: "Spam", severity: 3,
                assigned_to: "", notes: "", action: "Pending Review", is_urgent: false,
                target_id: "", target_type: "post"
            });
        }
        setFormOpen(true);
    };

    const handleFormSubmit = async () => {
        if (!formData.title) return toast.error("Title required");
        try {
            if (selectedId) {
                await api.put(`/api/v1/admin/reports/${selectedId}`, formData);
                toast.success("Report Case updated!");
            } else {
                await api.post("/api/v1/admin/reports", formData);
                toast.success("Report Case created!");
            }
            setFormOpen(false);
            fetchData();
        } catch {
            toast.error("Operation failed");
        }
    };

    const handleDelete = async () => {
        if (!selectedId) return;
        try {
            await api.delete(`/api/v1/admin/reports/${selectedId}`);
            toast.success("Report Case deleted");
            setDeleteConfirmOpen(false);
            fetchData();
        } catch {
            toast.error("Delete failed");
        }
    };

    const columns: GridColDef[] = [
        { field: "id", headerName: "Case ID", width: 110 },
        { field: "title", headerName: "Case Title", width: 220 },
        { field: "type", headerName: "Type", width: 130 },
        { field: "severity", headerName: "Severity (1-5)", type: "number", width: 120 },
        { field: "action", headerName: "Status/Action", width: 150 },
        { field: "is_urgent", headerName: "Urgent", type: "boolean", width: 90 },
        {
            field: "actions", headerName: "Actions", type: "actions", width: 120,
            getActions: (params) => [
                <GridActionsCellItem key="edit" icon={<Edit2 size={18} />} label="Edit" onClick={() => handleOpenForm(params.row)} />,
                <GridActionsCellItem key="delete" icon={<Trash2 size={18} color="red" />} label="Delete" onClick={() => { setSelectedId(params.row.id); setDeleteConfirmOpen(true); }} />
            ]
        }
    ];

    return (
        <ThemeProvider theme={darkTheme}>
            <CssBaseline />
            <Box sx={{ p: 4, height: '100vh', display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h4" gutterBottom fontWeight="bold" color="error.main">Reported Content Cases</Typography>

                {/* Controls Bar */}
                <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                    <TextField
                        size="small"
                        label="Search by Case ID"
                        variant="outlined"
                        value={searchId}
                        onChange={(e) => setSearchId(e.target.value)}
                    />
                    <Button variant="contained" onClick={handleSearch}>Search</Button>
                    <Button variant="contained" color="error" onClick={() => handleOpenForm()} sx={{ ml: 'auto' }}>
                        + Create Manual Case
                    </Button>
                </Box>

                {/* Data Grid */}
                <Box sx={{ flexGrow: 1, width: '100%', minHeight: 400 }}>
                    <DataGrid
                        rows={rows}
                        columns={columns}
                        loading={loading}
                        checkboxSelection
                        disableRowSelectionOnClick
                    />
                </Box>

                {/* CRUD Form Dialog (7 Controls) */}
                <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth>
                    <DialogTitle>{selectedId ? "Edit Case" : "Create Manual Report Case"}</DialogTitle>
                    <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField label="1. Case Title" fullWidth value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />

                        <FormControl fullWidth>
                            <InputLabel>2. Violation Type</InputLabel>
                            <Select value={formData.type} label="2. Violation Type" onChange={e => setFormData({ ...formData, type: e.target.value })}>
                                <MenuItem value="Spam">Spam/Bot</MenuItem>
                                <MenuItem value="Harassment">Harassment</MenuItem>
                                <MenuItem value="Misinformation">Misinformation</MenuItem>
                                <MenuItem value="Inappropriate">Inappropriate Content</MenuItem>
                                <MenuItem value="General">General / Others</MenuItem>
                            </Select>
                        </FormControl>

                        <FormControl fullWidth>
                            <InputLabel>3. Severity (1-5)</InputLabel>
                            <Select value={formData.severity} label="3. Severity (1-5)" onChange={e => setFormData({ ...formData, severity: Number(e.target.value) })}>
                                {[1, 2, 3, 4, 5].map(v => <MenuItem key={v} value={v}>{v}</MenuItem>)}
                            </Select>
                        </FormControl>

                        <TextField label="4. Assigned Admin" fullWidth value={formData.assigned_to} onChange={e => setFormData({ ...formData, assigned_to: e.target.value })} />
                        <TextField label="5. Investigation Notes" fullWidth multiline rows={2} value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} />

                        <FormControl fullWidth>
                            <InputLabel>6. Action Taken</InputLabel>
                            <Select value={formData.action} label="6. Action Taken" onChange={e => setFormData({ ...formData, action: e.target.value })}>
                                <MenuItem value="Pending Review">Pending Review</MenuItem>
                                <MenuItem value="User Warned">User Warned</MenuItem>
                                <MenuItem value="Content Deleted">Content Deleted</MenuItem>
                                <MenuItem value="User Banned">User Banned</MenuItem>
                                <MenuItem value="Cleared (No Issue)">Cleared (No Issue)</MenuItem>
                            </Select>
                        </FormControl>

                        <FormControlLabel
                            control={<Switch checked={formData.is_urgent} onChange={e => setFormData({ ...formData, is_urgent: e.target.checked })} />}
                            label="7. Mark as Urgent Escalation"
                        />

                        <Box sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 1, border: '1px dashed rgba(255,255,255,0.2)' }}>
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>CONTENT LINKING (ADVANCED)</Typography>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <TextField 
                                    label="Target ID (Slug or GUID)" 
                                    size="small" 
                                    fullWidth 
                                    value={formData.target_id} 
                                    onChange={e => setFormData({ ...formData, target_id: e.target.value })} 
                                />
                                <Select 
                                    size="small" 
                                    sx={{ minWidth: 100 }} 
                                    value={formData.target_type} 
                                    onChange={e => setFormData({ ...formData, target_type: e.target.value })}
                                >
                                    <MenuItem value="post">Post</MenuItem>
                                    <MenuItem value="user">User</MenuItem>
                                </Select>
                            </Box>
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setFormOpen(false)} color="inherit">Cancel</Button>
                        <Button onClick={handleFormSubmit} variant="contained" color="error">OK (Save)</Button>
                    </DialogActions>
                </Dialog>

                {/* Delete Confirmation */}
                <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
                    <DialogTitle>Confirm Dismissal</DialogTitle>
                    <DialogContent>Are you sure you want to permanently delete this report case? Normal resolution uses the Action Taken dropdown.</DialogContent>
                    <DialogActions>
                        <Button onClick={() => setDeleteConfirmOpen(false)} color="inherit">Cancel</Button>
                        <Button onClick={handleDelete} variant="contained" color="error">OK (Delete)</Button>
                    </DialogActions>
                </Dialog>

            </Box>
        </ThemeProvider>
    );
}
