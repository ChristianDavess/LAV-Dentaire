'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency } from '@/lib/utils';
import { Edit, Search } from 'lucide-react';
import type { Procedure } from '@/types';

export default function ProceduresPage() {
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    fetchProcedures();
  }, []);

  const fetchProcedures = async () => {
    setLoading(true);
    const supabase = createClient();
    
    try {
      const { data } = await supabase
        .from('procedures')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });
      
      setProcedures(data || []);
    } catch (error) {
      console.error('Error fetching procedures:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePrice = async (procedureId: string, newPrice: number) => {
    const supabase = createClient();
    
    const { error } = await supabase
      .from('procedures')
      .update({ 
        price: newPrice,
        updated_at: new Date().toISOString()
      })
      .eq('id', procedureId);
    
    if (!error) {
      await fetchProcedures();
    }
  };

  // Get unique categories
  const categories = ['all', ...new Set(procedures.map(p => p.category))];

  // Filter procedures
  const filteredProcedures = procedures.filter(procedure => {
    const matchesSearch = procedure.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          procedure.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || procedure.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Group procedures by category
  const proceduresByCategory = filteredProcedures.reduce((acc, proc) => {
    if (!acc[proc.category]) {
      acc[proc.category] = [];
    }
    acc[proc.category].push(proc);
    return acc;
  }, {} as Record<string, Procedure[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Procedures</h2>
        <p className="text-muted-foreground">Manage dental procedures and pricing</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Dental Procedures</CardTitle>
              <CardDescription>All available procedures with pricing</CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search procedures..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="mb-4">
              {categories.map((category) => (
                <TabsTrigger key={category} value={category}>
                  {category === 'all' ? 'All' : category.split(' ').map(word => 
                    word.charAt(0) + word.slice(1).toLowerCase()
                  ).join(' ')}
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="space-y-6">
              {Object.entries(proceduresByCategory).map(([category, procs]) => (
                <div key={category}>
                  <h3 className="text-lg font-semibold mb-3">{category}</h3>
                  <div className="grid gap-3">
                    {procs.map((procedure) => (
                      <ProcedureCard
                        key={procedure.id}
                        procedure={procedure}
                        onUpdatePrice={updatePrice}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Tabs>

          {filteredProcedures.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No procedures found matching your search.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface ProcedureCardProps {
  procedure: Procedure;
  onUpdatePrice: (id: string, price: number) => void;
}

function ProcedureCard({ procedure, onUpdatePrice }: ProcedureCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editPrice, setEditPrice] = useState(procedure.price.toString());

  const handleSave = () => {
    const newPrice = parseFloat(editPrice);
    if (!isNaN(newPrice) && newPrice >= 0) {
      onUpdatePrice(procedure.id, newPrice);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditPrice(procedure.price.toString());
    setIsEditing(false);
  };

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
      <div>
        <h4 className="font-medium">{procedure.name}</h4>
        {procedure.description && (
          <p className="text-sm text-muted-foreground">{procedure.description}</p>
        )}
      </div>
      <div className="flex items-center gap-3">
        {isEditing ? (
          <>
            <div className="flex items-center gap-1">
              <span className="text-sm">₱</span>
              <Input
                type="number"
                value={editPrice}
                onChange={(e) => setEditPrice(e.target.value)}
                className="w-24 h-8"
                min="0"
                step="100"
              />
            </div>
            <Button size="sm" variant="default" onClick={handleSave}>
              Save
            </Button>
            <Button size="sm" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
          </>
        ) : (
          <>
            <Badge variant="secondary" className="font-mono">
              {formatCurrency(procedure.price)}
            </Badge>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setIsEditing(true)}
            >
              <Edit className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}