import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Bell, Check, X } from "lucide-react";
import { format } from "date-fns";

interface Notification {
  id: string;
  type: string;
  payload: any;
  read: boolean;
  created_at: string;
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        loadNotifications(session.user.id);
        setupRealtimeSubscription(session.user.id);
      }
    };

    getUser();
  }, []);

  const loadNotifications = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.read).length || 0);
    } catch (error: any) {
      console.error('Error loading notifications:', error);
    }
  };

  const setupRealtimeSubscription = (userId: string) => {
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
          
          // Show toast for new notification
          if (newNotification.type === 'booking_request') {
            toast({
              title: "New Booking Request",
              description: `${newNotification.payload.client_name} wants to book ${newNotification.payload.service_title}`,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleBookingResponse = async (notificationId: string, bookingId: string, status: 'confirmed' | 'rejected') => {
    try {
      const { data, error } = await supabase.functions.invoke('update-booking-status', {
        body: {
          booking_id: bookingId,
          status,
        },
      });

      if (error) {
        const serverMsg = (data as any)?.error || (data as any)?.message;
        throw new Error(serverMsg || error.message);
      }

      // Remove the notification from the UI
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      toast({
        title: status === 'confirmed' ? "Booking Confirmed" : "Booking Rejected",
        description: `You have ${status} the booking request.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update booking status",
        variant: "destructive",
      });
    }
  };

  const renderNotificationContent = (notification: Notification) => {
    switch (notification.type) {
      case 'booking_request':
        return (
          <div className="space-y-2">
            <p className="text-sm font-medium">New Booking Request</p>
            <p className="text-xs text-muted-foreground">
              {notification.payload.client_name} wants to book "{notification.payload.service_title}"
            </p>
            <p className="text-xs text-muted-foreground">
              {format(new Date(notification.payload.start_time), 'MMM d, h:mm a')} - 
              {format(new Date(notification.payload.end_time), 'h:mm a')}
            </p>
            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                onClick={() => handleBookingResponse(notification.id, notification.payload.booking_id, 'confirmed')}
                className="text-xs"
              >
                <Check className="w-3 h-3 mr-1" />
                Accept
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBookingResponse(notification.id, notification.payload.booking_id, 'rejected')}
                className="text-xs"
              >
                <X className="w-3 h-3 mr-1" />
                Reject
              </Button>
            </div>
          </div>
        );
      
      case 'booking_confirmed':
        return (
          <div className="space-y-2">
            <p className="text-sm font-medium">Booking Confirmed</p>
            <p className="text-xs text-muted-foreground">
              Your booking for "{notification.payload.service_title}" has been confirmed
            </p>
          </div>
        );
      
      case 'booking_rejected':
        return (
          <div className="space-y-2">
            <p className="text-sm font-medium">Booking Rejected</p>
            <p className="text-xs text-muted-foreground">
              Your booking request was declined
            </p>
          </div>
        );
      
      default:
        return (
          <p className="text-sm">{notification.payload.message || 'New notification'}</p>
        );
    }
  };

  if (!user) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">Notifications</h4>
            {unreadCount > 0 && (
              <Badge variant="secondary">{unreadCount} new</Badge>
            )}
          </div>
          
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-4">
                No notifications yet
              </p>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg border ${
                    notification.read 
                      ? 'bg-background' 
                      : 'bg-primary/5 border-primary/20'
                  }`}
                >
                  {renderNotificationContent(notification)}
                  <p className="text-xs text-muted-foreground mt-2">
                    {format(new Date(notification.created_at), 'MMM d, h:mm a')}
                  </p>
                  {!notification.read && notification.type !== 'booking_request' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => markAsRead(notification.id)}
                      className="text-xs mt-2"
                    >
                      Mark as read
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}