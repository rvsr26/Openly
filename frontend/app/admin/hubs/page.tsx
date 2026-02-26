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
        primary: { main: "#8b5cf6" }, // purple for hubs
        background: { default: "#000000", paper: "#111111" }
    },
});

export default function AdminHubs() {
    const { user: currentUser } = useAuth();
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchId, setSearchId] = useState("");

    // Dialog States
    const [formOpen, setFormOpen] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: "", sector: "Tech", lead_admin: "",
        theme_color: "#000000", ui_status: "Visible", resource_url: "", is_featured: false
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get("/api/v1/admin/hubs");
            setRows(res.data);
        } catch {
            toast.error("Failed to fetch hubs");
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
            const res = await api.get(`/api/v1/admin/hubs/search/${searchId}`);
            setRows([res.data] as any);
            toast.success("Record found");
        } catch {
            toast.error("Hub not found");
            setRows([]);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenForm = (doc?: any) => {
        if (doc) {
            setSelectedId(doc.id);
            setFormData({
                name: doc.name, sector: doc.sector, lead_admin: doc.lead_admin,
                theme_color: doc.theme_color, ui_status: doc.ui_status,
                resource_url: doc.resource_url, is_featured: doc.is_featured
            });
        } else {
            setSelectedId(null);
            setFormData({
                name: "", sector: "Tech", lead_admin: "",
                theme_color: "#000000", ui_status: "Visible", resource_url: "", is_featured: false
            });
        }
        setFormOpen(true);
    };

    const handleFormSubmit = async () => {
        if (!formData.name) return toast.error("Name required");
        try {
            if (selectedId) {
                await api.put(`/api/v1/admin/hubs/${selectedId}`, formData);
                toast.success("Hub updated!");
            } else {
                await api.post("/api/v1/admin/hubs", formData);
                toast.success("Hub created!");
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
            await api.delete(`/api/v1/admin/hubs/${selectedId}`);
            toast.success("Hub deleted");
            setDeleteConfirmOpen(false);
            fetchData();
        } catch {
            toast.error("Delete failed");
        }
    };

    const columns: GridColDef[] = [
        { field: "id", headerName: "Hub ID", width: 130 },
        { field: "name", headerName: "Hub Name", width: 200 },
        { field: "sector", headerName: "Sector", width: 130 },
        { field: "lead_admin", headerName: "Lead Admin (ID)", width: 150 },
        { field: "ui_status", headerName: "Visibility", width: 120 },
        { field: "is_featured", headerName: "Featured", type: "boolean", width: 100 },
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
                <Typography variant="h4" gutterBottom fontWeight="bold">Industry Hubs Manager</Typography>

                {/* Controls Bar */}
                <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                    <TextField
                        size="small"
                        label="Search by Hub ID"
                        variant="outlined"
                        value={searchId}
                        onChange={(e) => setSearchId(e.target.value)}
                    />
                    <Button variant="contained" onClick={handleSearch}>Search</Button>
                    <Button variant="contained" color="success" onClick={() => handleOpenForm()} sx={{ ml: 'auto' }}>
                        + Create Hub
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
                    <DialogTitle>{selectedId ? "Edit Hub" : "Create Industry Hub"}</DialogTitle>
                    <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField label="1. Hub Name" fullWidth value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />

                        <FormControl fullWidth>
                            <InputLabel>2. Sector</InputLabel>
                            <Select value={formData.sector} label="2. Sector" onChange={e => setFormData({ ...formData, sector: e.target.value })}>
                                <MenuItem value="Tech">Technology</MenuItem>
                                <MenuItem value="Health">Healthcare</MenuItem>
                                <MenuItem value="Finance">Finance</MenuItem>
                                <MenuItem value="Education">Education</MenuItem>
                            </Select>
                        </FormControl>

                        <TextField label="3. Lead Admin Username" fullWidth value={formData.lead_admin} onChange={e => setFormData({ ...formData, lead_admin: e.target.value })} />
                        <TextField label="4. Theme Color (Hex)" fullWidth type="color" value={formData.theme_color} onChange={e => setFormData({ ...formData, theme_color: e.target.value })} />

                        <FormControl fullWidth>
                            <InputLabel>5. UI Status</InputLabel>
                            <Select value={formData.ui_status} label="5. UI Status" onChange={e => setFormData({ ...formData, ui_status: e.target.value })}>
                                <MenuItem value="Visible">Visible</MenuItem>
                                <MenuItem value="Hidden">Hidden</MenuItem>
                                <MenuItem value="Archived">Archived</MenuItem>
                            </Select>
                        </FormControl>

                        <TextField label="6. External Resource URL" fullWidth value={formData.resource_url} onChange={e => setFormData({ ...formData, resource_url: e.target.value })} />

                        <FormControlLabel
                            control={<Switch checked={formData.is_featured} onChange={e => setFormData({ ...formData, is_featured: e.target.checked })} />}
                            label="7. Is Featured Hub"
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
                    <DialogContent>Are you sure you want to permanently delete this Hub record? Associated data might be affected.</DialogContent>
                    <DialogActions>
                        <Button onClick={() => setDeleteConfirmOpen(false)} color="inherit">Cancel</Button>
                        <Button onClick={handleDelete} variant="contained" color="error">OK (Delete)</Button>
                    </DialogActions>
                </Dialog>

            </Box>
        </ThemeProvider>
    );
}
