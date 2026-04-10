import { useState } from "react";
import { useListDoctors } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Star, Phone, CheckCircle2, XCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export function Doctors() {
  const [searchQuery, setSearchQuery] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState("all");

  const { data: doctors, isLoading } = useListDoctors({
    query: searchQuery || undefined,
    specialty: specialtyFilter !== "all" ? specialtyFilter : undefined
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Find a Specialist</h1>
        <p className="text-muted-foreground mt-2">Connect with top-rated doctors for your health concerns.</p>
      </div>

      <Card className="bg-muted/30 border-none shadow-none">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by doctor name or hospital..." 
              className="pl-9 bg-background"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
            <SelectTrigger className="w-full md:w-[200px] bg-background">
              <SelectValue placeholder="All Specialties" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Specialties</SelectItem>
              <SelectItem value="Cardiology">Cardiology</SelectItem>
              <SelectItem value="Neurology">Neurology</SelectItem>
              <SelectItem value="Orthopedics">Orthopedics</SelectItem>
              <SelectItem value="Dermatology">Dermatology</SelectItem>
              <SelectItem value="Pediatrics">Pediatrics</SelectItem>
              <SelectItem value="Oncology">Oncology</SelectItem>
              <SelectItem value="General Medicine">General Medicine</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i}>
              <CardHeader className="flex flex-row gap-4 pb-2">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-10 w-full mt-4" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : doctors && doctors.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {doctors.map((doctor) => (
            <Card key={doctor.id} className="overflow-hidden hover:border-primary/50 transition-colors">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                      {doctor.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{doctor.name}</h3>
                      <p className="text-sm text-primary font-medium">{doctor.specialty}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 mr-2 shrink-0" />
                    <span className="truncate">{doctor.hospital}, {doctor.location}</span>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Star className="h-4 w-4 mr-2 text-yellow-500 fill-yellow-500 shrink-0" />
                    <span>{doctor.rating} Rating ({doctor.experience} yrs exp.)</span>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Phone className="h-4 w-4 mr-2 shrink-0" />
                    <span>{doctor.phone || "Contact hospital directly"}</span>
                  </div>
                  <div className="flex items-center text-sm mt-2">
                    {doctor.available ? (
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Available Today
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950 dark:text-rose-400">
                        <XCircle className="w-3 h-3 mr-1" /> Not Available
                      </Badge>
                    )}
                  </div>
                </div>

                <Button className="w-full mt-6" variant={doctor.available ? "default" : "secondary"}>
                  Book Appointment
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Search className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">No doctors found</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            We couldn't find any specialists matching your current search criteria.
          </p>
        </div>
      )}
    </div>
  );
}
