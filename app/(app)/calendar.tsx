import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Modal, TextInput, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/core/store/useAuthStore';
import { supabase } from '@/core/config/supabase';
import { eventsService } from '@/core/services/eventsService';
import { CoupleEvent, EventType, EVENT_TYPES, CreateEventData } from '@/core/types/events';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

export default function CalendarScreen() {
    const { user } = useAuthStore();
    const router = useRouter();
    const [events, setEvents] = useState<CoupleEvent[]>([]);
    const [upcomingEvents, setUpcomingEvents] = useState<CoupleEvent[]>([]);
    const [coupleId, setCoupleId] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingEvent, setEditingEvent] = useState<CoupleEvent | null>(null);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);

    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [eventType, setEventType] = useState<EventType>('date');
    const [location, setLocation] = useState('');

    useEffect(() => {
        loadCoupleId();
    }, []);

    useEffect(() => {
        if (coupleId) {
            loadEvents();
        }
    }, [coupleId]);

    const loadCoupleId = async () => {
        if (!user) return;

        const { data } = await supabase
            .from('users')
            .select('couple_id')
            .eq('id', user.id)
            .single();

        if (data?.couple_id) {
            setCoupleId(data.couple_id);
        }
    };

    const loadEvents = async () => {
        if (!coupleId) return;

        try {
            const allEvents = await eventsService.getEvents(coupleId);
            const upcoming = await eventsService.getUpcomingEvents(coupleId, 10);
            setEvents(allEvents);
            setUpcomingEvents(upcoming);
        } catch (error: any) {
            console.error('Error loading events:', error);
            // Si la tabla no existe, mostrar mensaje amigable
            if (error?.code === 'PGRST205') {
                // Tabla no existe
            }
        }
    };

    const handleCreateEvent = async () => {
        if (!title.trim() || !coupleId || !user) {
            Alert.alert('Error', 'Por favor completa el título del evento');
            return;
        }

        try {
            const eventData: CreateEventData = {
                title: title.trim(),
                description: description.trim() || undefined,
                event_date: selectedDate.toISOString(),
                event_type: eventType,
                location: location.trim() || undefined,
                reminder_enabled: true,
            };

            if (editingEvent) {
                // Actualizar evento existente
                await eventsService.updateEvent(editingEvent.id, eventData);
            } else {
                // Crear nuevo evento
                await eventsService.createEvent(coupleId, user.id, eventData);
            }

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setShowCreateModal(false);
            resetForm();
            loadEvents();
        } catch (error) {
            console.error('Error saving event:', error);
            Alert.alert('Error', 'No se pudo guardar el evento');
        }
    };

    const handleDeleteEvent = async (eventId: string) => {
        Alert.alert(
            'Eliminar Evento',
            '¿Estás seguro de que quieres eliminar este evento?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await eventsService.deleteEvent(eventId);
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            loadEvents();
                        } catch (error) {
                            console.error('Error deleting event:', error);
                            Alert.alert('Error', 'No se pudo eliminar el evento');
                        }
                    },
                },
            ]
        );
    };

    const resetForm = () => {
        setTitle('');
        setDescription('');
        setEventType('date');
        setLocation('');
        setSelectedDate(new Date());
        setShowDatePicker(false);
        setShowTimePicker(false);
        setEditingEvent(null);
    };

    const handleEditEvent = (event: CoupleEvent) => {
        setEditingEvent(event);
        setTitle(event.title);
        setDescription(event.description || '');
        setEventType(event.event_type);
        setLocation(event.location || '');
        setSelectedDate(new Date(event.event_date));
        setShowCreateModal(true);
    };

    const handleDateChange = (event: DateTimePickerEvent, date?: Date) => {
        setShowDatePicker(false);
        if (event.type === 'set' && date) {
            setSelectedDate(date);
            // En Android, mostrar el time picker después del date picker
            if (Platform.OS === 'android') {
                setTimeout(() => setShowTimePicker(true), 100);
            }
        }
    };

    const handleTimeChange = (event: DateTimePickerEvent, date?: Date) => {
        setShowTimePicker(false);
        if (event.type === 'set' && date) {
            setSelectedDate(date);
        }
    };

    const getCurrentMonth = () => {
        const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        return `${months[new Date().getMonth()]} ${new Date().getFullYear()}`;
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#181113" />
                </Pressable>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle}>Calendario</Text>
                    <Text style={styles.headerSubtitle}>Tus momentos compartidos</Text>
                </View>
                <Pressable
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setShowCreateModal(true);
                    }}
                    style={styles.addButton}
                >
                    <Ionicons name="add" size={28} color="#FF6B9D" />
                </Pressable>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Calendar Header */}
                <View style={styles.calendarHeader}>
                    <Pressable style={styles.monthNav}>
                        <Ionicons name="chevron-back" size={24} color="#6B7280" />
                    </Pressable>
                    <Text style={styles.monthText}>{getCurrentMonth()}</Text>
                    <Pressable style={styles.monthNav}>
                        <Ionicons name="chevron-forward" size={24} color="#6B7280" />
                    </Pressable>
                </View>

                {/* Próximos Momentos */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Próximos Momentos</Text>
                        <Pressable>
                            <Text style={styles.seeAllText}>Ver todo</Text>
                        </Pressable>
                    </View>

                    {upcomingEvents.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyEmoji}>📅</Text>
                            <Text style={styles.emptyText}>No hay eventos próximos</Text>
                            <Text style={styles.emptySubtext}>Crea tu primer momento especial</Text>
                        </View>
                    ) : (
                        upcomingEvents.map((event) => {
                            const eventConfig = EVENT_TYPES[event.event_type];
                            const daysUntil = eventsService.getDaysUntil(event.event_date);

                            return (
                                <Pressable
                                    key={event.id}
                                    style={styles.eventCard}
                                    onPress={() => {
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        handleEditEvent(event);
                                    }}
                                    onLongPress={() => handleDeleteEvent(event.id)}
                                >
                                    <View style={[styles.eventIcon, { backgroundColor: eventConfig.color + '20' }]}>
                                        <Text style={styles.eventEmoji}>{eventConfig.emoji}</Text>
                                    </View>
                                    <View style={styles.eventInfo}>
                                        <Text style={styles.eventTitle}>{event.title}</Text>
                                        <Text style={styles.eventDate}>
                                            {new Date(event.event_date).toLocaleDateString('es-ES', {
                                                day: 'numeric',
                                                month: 'long',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </Text>
                                        {event.location && (
                                            <Text style={styles.eventLocation}>📍 {event.location}</Text>
                                        )}
                                    </View>
                                    <View style={styles.eventBadge}>
                                        <Text style={[styles.eventBadgeText, { color: eventConfig.color }]}>
                                            {daysUntil === 0 ? 'HOY' : daysUntil === 1 ? 'MAÑANA' : `EN ${daysUntil} DÍAS`}
                                        </Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
                                </Pressable>
                            );
                        })
                    )}
                </View>
            </ScrollView>

            {/* Floating Action Button */}
            <Pressable
                style={styles.fab}
                onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    setShowCreateModal(true);
                }}
            >
                <Ionicons name="add" size={32} color="#FFF" />
            </Pressable>

            {/* Create Event Modal */}
            <Modal
                visible={showCreateModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowCreateModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {editingEvent ? 'Editar Momento' : 'Nuevo Momento'}
                            </Text>
                            <Pressable onPress={() => {
                                setShowCreateModal(false);
                                resetForm();
                            }}>
                                <Ionicons name="close" size={28} color="#6B7280" />
                            </Pressable>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {/* Tipo de Evento */}
                            <Text style={styles.label}>Tipo de Evento</Text>
                            <View style={styles.eventTypeGrid}>
                                {(Object.keys(EVENT_TYPES) as EventType[]).map((type) => {
                                    const config = EVENT_TYPES[type];
                                    const isSelected = eventType === type;
                                    return (
                                        <Pressable
                                            key={type}
                                            style={[
                                                styles.eventTypeButton,
                                                isSelected && { backgroundColor: config.color + '20', borderColor: config.color }
                                            ]}
                                            onPress={() => {
                                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                                setEventType(type);
                                            }}
                                        >
                                            <Text style={styles.eventTypeEmoji}>{config.emoji}</Text>
                                            <Text style={[styles.eventTypeLabel, isSelected && { color: config.color }]}>
                                                {config.label}
                                            </Text>
                                        </Pressable>
                                    );
                                })}
                            </View>

                            {/* Título */}
                            <Text style={styles.label}>Título *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Ej: Cena romántica"
                                value={title}
                                onChangeText={setTitle}
                                maxLength={50}
                            />

                            {/* Fecha y Hora */}
                            <Text style={styles.label}>Fecha y Hora</Text>
                            <Pressable
                                style={styles.dateButton}
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    setShowDatePicker(true);
                                }}
                            >
                                <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                                <Text style={styles.dateButtonText}>
                                    {selectedDate.toLocaleDateString('es-ES', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </Text>
                            </Pressable>

                            {/* Date Picker */}
                            {showDatePicker && (
                                <DateTimePicker
                                    value={selectedDate}
                                    mode="date"
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    onChange={handleDateChange}
                                    minimumDate={new Date()}
                                />
                            )}

                            {/* Time Picker */}
                            {showTimePicker && (
                                <DateTimePicker
                                    value={selectedDate}
                                    mode="time"
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    onChange={handleTimeChange}
                                />
                            )}

                            {/* Ubicación */}
                            <Text style={styles.label}>Ubicación</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Ej: Restaurante Italiano"
                                value={location}
                                onChangeText={setLocation}
                                maxLength={100}
                            />

                            {/* Descripción */}
                            <Text style={styles.label}>Descripción</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                placeholder="Agrega detalles sobre este momento..."
                                value={description}
                                onChangeText={setDescription}
                                multiline
                                numberOfLines={4}
                                maxLength={200}
                            />

                            {/* Botones */}
                            <View style={styles.modalButtons}>
                                <Pressable
                                    style={[styles.modalButton, styles.cancelButton]}
                                    onPress={() => {
                                        setShowCreateModal(false);
                                        resetForm();
                                    }}
                                >
                                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                                </Pressable>
                                <Pressable
                                    style={[styles.modalButton, styles.createButton]}
                                    onPress={handleCreateEvent}
                                >
                                    <Text style={styles.createButtonText}>
                                        {editingEvent ? 'Guardar Cambios' : 'Crear Evento'}
                                    </Text>
                                </Pressable>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitleContainer: {
        flex: 1,
        marginLeft: 12,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#181113',
    },
    headerSubtitle: {
        fontSize: 13,
        color: '#9CA3AF',
        marginTop: 2,
    },
    addButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
    },
    calendarHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 20,
        backgroundColor: '#FFF',
        marginBottom: 16,
    },
    monthNav: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    monthText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#181113',
    },
    section: {
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#181113',
    },
    seeAllText: {
        fontSize: 14,
        color: '#FF6B9D',
        fontWeight: '600',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 48,
        backgroundColor: '#FFF',
        borderRadius: 16,
    },
    emptyEmoji: {
        fontSize: 48,
        marginBottom: 12,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6B7280',
        marginBottom: 4,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#9CA3AF',
    },
    eventCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    eventIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    eventEmoji: {
        fontSize: 28,
    },
    eventInfo: {
        flex: 1,
    },
    eventTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#181113',
        marginBottom: 4,
    },
    eventDate: {
        fontSize: 13,
        color: '#6B7280',
        marginBottom: 2,
    },
    eventLocation: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    eventBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        backgroundColor: '#FEF3F2',
        marginRight: 8,
    },
    eventBadgeText: {
        fontSize: 11,
        fontWeight: '700',
    },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#FF6B9D',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#FF6B9D',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop: 24,
        paddingHorizontal: 20,
        paddingBottom: 40,
        maxHeight: '90%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#181113',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
        marginTop: 16,
    },
    eventTypeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 8,
        gap: 8,
    },
    eventTypeButton: {
        width: '48%',
        padding: 16,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#E5E7EB',
        alignItems: 'center',
        backgroundColor: '#FFF',
    },
    eventTypeEmoji: {
        fontSize: 32,
        marginBottom: 8,
    },
    eventTypeLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6B7280',
        textAlign: 'center',
    },
    input: {
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        padding: 16,
        fontSize: 15,
        color: '#181113',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    dateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    dateButtonText: {
        fontSize: 15,
        color: '#181113',
        marginLeft: 12,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 24,
    },
    modalButton: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#F3F4F6',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6B7280',
    },
    createButton: {
        backgroundColor: '#FF6B9D',
    },
    createButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFF',
    },
});
