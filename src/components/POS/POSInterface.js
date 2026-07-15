import React, { useState } from 'react';
import {
  Box, Grid, Paper, Button, Typography, IconButton,
  TextField, Tabs, Tab, Dialog, DialogTitle, DialogContent
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Payment as PaymentIcon,
  Kitchen as KitchenIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';

const POSInterface = () => {
  const [currentOrder, setCurrentOrder] = useState({
    items: [],
    subtotal: 0,
    tax: 0,
    total: 0
  });
  
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [tableNumber, setTableNumber] = useState('');
  const [paymentOpen, setPaymentOpen] = useState(false);

  const menuItems = [
    { _id: '1', name: '🥗 Ensalada 360', price: 9.99, category: 'appetizers' },
    { _id: '2', name: '🥣 Sopa de la Casa', price: 7.99, category: 'appetizers' },
    { _id: '3', name: '🧀 Tabla de Quesos', price: 15.99, category: 'appetizers' },
    { _id: '4', name: '🍔 Hamburguesa 360', price: 12.99, category: 'main_course' },
    { _id: '5', name: '🍕 Pizza del Chef', price: 14.99, category: 'main_course' },
    { _id: '6', name: '🥩 Filete Angus', price: 24.99, category: 'main_course' },
    { _id: '7', name: '🍝 Pasta Alfredo', price: 13.99, category: 'main_course' },
    { _id: '8', name: '🌮 Tacos 360', price: 11.99, category: 'main_course' },
    { _id: '9', name: '🍰 Pastel 360', price: 8.99, category: 'desserts' },
    { _id: '10', name: '🍦 Helado Artesanal', price: 5.99, category: 'desserts' },
    { _id: '11', name: '🥤 Limonada 360', price: 3.99, category: 'beverages' },
    { _id: '12', name: '☕ Café Especial', price: 4.49, category: 'beverages' },
    { _id: '13', name: '🍺 Cerveza Artesanal', price: 6.99, category: 'beverages' },
    { _id: '14', name: '🍷 Vino de la Casa', price: 8.99, category: 'beverages' },
  ];

  const addToOrder = (item) => {
    const existingItem = currentOrder.items.find(i => i._id === item._id);
    
    if (existingItem) {
      updateItemQuantity(item._id, existingItem.quantity + 1);
    } else {
      const newItem = { ...item, quantity: 1 };
      const newItems = [...currentOrder.items, newItem];
      updateOrderTotals(newItems);
      toast.success(`${item.name} agregado`);
    }
  };

  const updateItemQuantity = (itemId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromOrder(itemId);
      return;
    }
    
    const newItems = currentOrder.items.map(item =>
      item._id === itemId ? { ...item, quantity: newQuantity } : item
    );
    updateOrderTotals(newItems);
  };

  const removeFromOrder = (itemId) => {
    const newItems = currentOrder.items.filter(item => item._id !== itemId);
    updateOrderTotals(newItems);
  };

  const updateOrderTotals = (items) => {
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.08;
    const total = subtotal + tax;
    
    setCurrentOrder({ items, subtotal, tax, total });
  };

  const handlePayment = (method) => {
    toast.success(`✅ Cobro exitoso: $${currentOrder.total.toFixed(2)}`);
    setCurrentOrder({ items: [], subtotal: 0, tax: 0, total: 0 });
    setTableNumber('');
    setPaymentOpen(false);
  };

  const clearOrder = () => {
    if (currentOrder.items.length === 0) return;
    setCurrentOrder({ items: [], subtotal: 0, tax: 0, total: 0 });
    toast.warning('Orden cancelada');
  };

  const filteredMenu = selectedCategory === 'all' 
    ? menuItems 
    : menuItems.filter(item => item.category === selectedCategory);

  return (
    <Box sx={{ height: '100vh', bgcolor: '#FFF5F0' }}>
      {/* HEADER */}
      <Box sx={{ 
        bgcolor: '#FF6B35', 
        color: 'white', 
        p: 2, 
        display: 'flex', 
        alignItems: 'center',
        boxShadow: 3
      }}>
        <KitchenIcon sx={{ fontSize: 40, mr: 2 }} />
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          COCINA 360
        </Typography>
      </Box>
      
      <Grid container spacing={2} sx={{ height: 'calc(100vh - 82px)', p: 2 }}>
        {/* MENÚ */}
        <Grid item xs={8}>
          <Paper sx={{ p: 2, height: '100%', borderRadius: 3 }}>
            <Tabs
              value={selectedCategory}
              onChange={(e, v) => setSelectedCategory(v)}
              variant="fullWidth"
              sx={{ mb: 2 }}
            >
              <Tab label="📋 TODOS" value="all" />
              <Tab label="🥗 ENTRADAS" value="appetizers" />
              <Tab label="🍖 PLATOS" value="main_course" />
              <Tab label="🍰 POSTRES" value="desserts" />
              <Tab label="🥤 BEBIDAS" value="beverages" />
            </Tabs>

            <Box sx={{ overflow: 'auto', height: 'calc(100% - 60px)' }}>
              <Grid container spacing={2}>
                {filteredMenu.map(item => (
                  <Grid item xs={6} sm={4} md={4} lg={3} key={item._id}>
                    <Paper
                      elevation={3}
                      sx={{
                        p: 2,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        height: 120,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        textAlign: 'center',
                        borderRadius: 3,
                        '&:hover': { 
                          bgcolor: '#FF6B35', 
                          color: 'white',
                          transform: 'scale(1.05)'
                        }
                      }}
                      onClick={() => addToOrder(item)}
                    >
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {item.name}
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 'bold', mt: 1 }}>
                        ${item.price.toFixed(2)}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Paper>
        </Grid>

        {/* ORDEN */}
        <Grid item xs={4}>
          <Paper sx={{ 
            p: 2, 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column',
            borderRadius: 3
          }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
              📝 Orden Actual
            </Typography>
            
            <TextField
              label="Mesa #"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              size="small"
              fullWidth
              sx={{ mb: 2 }}
            />

            <Box sx={{ flex: 1, overflow: 'auto', mb: 2 }}>
              {currentOrder.items.length === 0 ? (
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  height: '100%',
                  color: 'text.secondary'
                }}>
                  <Typography>
                    Selecciona productos del menú
                  </Typography>
                </Box>
              ) : (
                currentOrder.items.map((item, index) => (
                  <Paper
                    key={index}
                    sx={{
                      p: 1.5,
                      mb: 1,
                      display: 'flex',
                      alignItems: 'center',
                      borderRadius: 2,
                      bgcolor: '#FFF5F0'
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Typography fontWeight="bold">
                        {item.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        ${item.price.toFixed(2)} c/u
                      </Typography>
                    </Box>
                    
                    <IconButton size="small" onClick={() => updateItemQuantity(item._id, item.quantity - 1)}>
                      <RemoveIcon />
                    </IconButton>
                    
                    <Typography sx={{ mx: 1, fontWeight: 'bold' }}>
                      {item.quantity}
                    </Typography>
                    
                    <IconButton size="small" onClick={() => updateItemQuantity(item._id, item.quantity + 1)}>
                      <AddIcon />
                    </IconButton>
                    
                    <IconButton size="small" onClick={() => removeFromOrder(item._id)} color="error">
                      <DeleteIcon />
                    </IconButton>
                  </Paper>
                ))
              )}
            </Box>

            {currentOrder.items.length > 0 && (
              <Box sx={{ mb: 2, p: 2, bgcolor: '#FFF5F0', borderRadius: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography>Subtotal:</Typography>
                  <Typography>${currentOrder.subtotal.toFixed(2)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography>IVA (8%):</Typography>
                  <Typography>${currentOrder.tax.toFixed(2)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 1, borderTop: '2px dashed #ccc' }}>
                  <Typography variant="h6" fontWeight="bold">TOTAL:</Typography>
                  <Typography variant="h6" fontWeight="bold" color="#FF6B35">
                    ${currentOrder.total.toFixed(2)}
                  </Typography>
                </Box>
              </Box>
            )}

            <Grid container spacing={1}>
              <Grid item xs={6}>
                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  startIcon={<PaymentIcon />}
                  onClick={() => setPaymentOpen(true)}
                  disabled={currentOrder.items.length === 0}
                  sx={{ 
                    py: 1.5,
                    bgcolor: '#2ECC71',
                    '&:hover': { bgcolor: '#27AE60' },
                    fontWeight: 'bold'
                  }}
                >
                  COBRAR
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button
                  variant="outlined"
                  color="error"
                  fullWidth
                  size="large"
                  onClick={clearOrder}
                  disabled={currentOrder.items.length === 0}
                  sx={{ py: 1.5, fontWeight: 'bold' }}
                >
                  CANCELAR
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      {/* MODAL DE PAGO */}
      <Dialog open={paymentOpen} onClose={() => setPaymentOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ textAlign: 'center', bgcolor: '#FF6B35', color: 'white' }}>
          💳 TOTAL A PAGAR
        </DialogTitle>
        <DialogContent sx={{ mt: 2, pb: 3 }}>
          <Typography variant="h3" sx={{ textAlign: 'center', mb: 3, fontWeight: 'bold', color: '#FF6B35' }}>
            ${currentOrder.total.toFixed(2)}
          </Typography>
          
          <Grid container spacing={2}>
            {[
              { method: 'Efectivo', icon: '💵' },
              { method: 'Tarjeta', icon: '💳' },
              { method: 'Débito', icon: '🏦' },
              { method: 'Móvil', icon: '📱' }
            ].map(payment => (
              <Grid item xs={6} key={payment.method}>
                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  onClick={() => handlePayment(payment.method)}
                  sx={{ 
                    py: 2,
                    bgcolor: '#FF6B35',
                    '&:hover': { bgcolor: '#E54E2E' },
                    fontSize: '1.1rem'
                  }}
                >
                  {payment.icon} {payment.method}
                </Button>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default POSInterface;