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
        primary: { main: "#3b82f6" },
        background: { default: "#000000", paper: "#111111" }
    },
});

export default function AdminCommunities() {
    const { user: currentUser } = useAuth();
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchId, setSearchId] = useState("");

    // Dialog States
    const [formOpen, setFormOpen] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: "", category: "General", privacy: "Public",
        description: "", rules: "", moderation_level: "Medium", active_status: true
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get("/api/v1/admin/communities");
            setRows(res.data);
        } catch {
            toast.error("Failed to fetch communities");
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
            const res = await api.get(`/api/v1/admin/communities/search/${searchId}`);
            setRows([res.data] as any);
            toast.success("Record found");
        } catch {
            toast.error("Community not found");
            setRows([]);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenForm = (doc?: any) => {
        if (doc) {
            setSelectedId(doc.id);
            setFormData({
                name: doc.name, category: doc.category, privacy: doc.privacy,
                description: doc.description, rules: doc.rules,
                moderation_level: doc.moderation_level, active_status: doc.active_status
            });
        } else {
            setSelectedId(null);
            setFormData({
                name: "", category: "General", privacy: "Public",
                description: "", rules: "", moderation_level: "Medium", active_status: true
            });
        }
        setFormOpen(true);
    };

    const handleFormSubmit = async () => {
        if (!formData.name) return toast.error("Name required");
        try {
            if (selectedId) {
                await api.put(`/api/v1/admin/communities/${selectedId}`, formData);
                toast.success("Community updated!");
            } else {
                await api.post("/api/v1/admin/communities", formData);
                toast.success("Community created!");
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
            await api.delete(`/api/v1/admin/communities/${selectedId}`);
            toast.success("Community deleted");
            setDeleteConfirmOpen(false);
            fetchData();
        } catch {
            toast.error("Delete failed");
        }
    };

    const columns: GridColDef[] = [
        { field: "id", headerName: "ID", width: 130 },
        { field: "name", headerName: "Name", width: 200 },
        { field: "category", headerName: "Category", width: 130 },
        { field: "privacy", headerName: "Privacy", width: 130 },
        { field: "moderation_level", headerName: "Mod Level", width: 130 },
        { field: "active_status", headerName: "Active", type: "boolean", width: 100 },
        {
            field: "actions", headerName: "Actions", type: "actions", width: 120,
            getActions: (params) => [
                <GridActionsCellItem icon={<Edit2 size={18} />} label="Edit" onClick={() => handleOpenForm(params.row)} />,
                <GridActionsCellItem icon={<Trash2 size={18} color="red" />} label="Delete" onClick={() => { setSelectedId(params.row.id); setDeleteConfirmOpen(true); }} />
            ]
        }
    ];

    return (
        <ThemeProvider theme={darkTheme}>
            <CssBaseline />
            <Box sx={{ p: 4, height: '100vh', display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h4" gutterBottom fontWeight="bold">Community Management</Typography>

                {/* Controls Bar */}
                <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                    <TextField
                        size="small"
                        label="Search by ID"
                        variant="outlined"
                        value={searchId}
                        onChange={(e) => setSearchId(e.target.value)}
                    />
                    <Button variant="contained" onClick={handleSearch}>Search</Button>
                    <Button variant="contained" color="success" onClick={() => handleOpenForm()} sx={{ ml: 'auto' }}>
                        + Add Community
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
                    <DialogTitle>{selectedId ? "Edit Community" : "Add Community"}</DialogTitle>
                    <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField label="1. Name" fullWidth value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />

                        <FormControl fullWidth>
                            <InputLabel>2. Category</InputLabel>
                            <Select value={formData.category} label="2. Category" onChange={e => setFormData({ ...formData, category: e.target.value })}>
                                <MenuItem value="General">General</MenuItem>
                                <MenuItem value="Tech">Tech</MenuItem>
                                <MenuItem value="Business">Business</MenuItem>
                            </Select>
                        </FormControl>

                        <FormControl fullWidth>
                            <InputLabel>3. Privacy</InputLabel>
                            <Select value={formData.privacy} label="3. Privacy" onChange={e => setFormData({ ...formData, privacy: e.target.value })}>
                                <MenuItem value="Public">Public</MenuItem>
                                <MenuItem value="Private">Private</MenuItem>
                            </Select>
                        </FormControl>

                        <TextField label="4. Description" fullWidth multiline rows={2} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                        <TextField label="5. Rules" fullWidth multiline rows={2} value={formData.rules} onChange={e => setFormData({ ...formData, rules: e.target.value })} />

                        <FormControl fullWidth>
                            <InputLabel>6. Moderation Level</InputLabel>
                            <Select value={formData.moderation_level} label="6. Moderation Level" onChange={e => setFormData({ ...formData, moderation_level: e.target.value })}>
                                <MenuItem value="Low">Low</MenuItem>
                                <MenuItem value="Medium">Medium</MenuItem>
                                <MenuItem value="High">High</MenuItem>
                            </Select>
                        </FormControl>

                        <FormControlLabel
                            control={<Switch checked={formData.active_status} onChange={e => setFormData({ ...formData, active_status: e.target.checked })} />}
                            label="7. Active Status / Live"
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setFormOpen(false)} color="inherit">Cancel</Button>
                        <Button onClick={handleFormSubmit} variant="contained" color="primary">OK (Save)</Button>
                    </DialogActions>
                </Dialog>

                {/* Delete Confirmation */}
                <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
                    <DialogTitle>Confirm Deletion</DialogTitle>
                    <DialogContent>Are you sure you want to permanently delete this record? This action cannot be undone.</DialogContent>
                    <DialogActions>
                        <Button onClick={() => setDeleteConfirmOpen(false)} color="inherit">Cancel</Button>
                        <Button onClick={handleDelete} variant="contained" color="error">OK (Delete)</Button>
                    </DialogActions>
                </Dialog>

            </Box>
        </ThemeProvider>
    );
}
