import React, { useState } from 'react';
import {
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../constants/Colors';

const hintIcon = require('../assets/images/hint.png');
import { Layout } from '../constants/Layout';
import { Typography } from '../constants/Typography';

interface HintBulbProps {
  hint: string;
  title?: string;
}

export default function HintBulb({ hint, title = 'Tip' }: HintBulbProps) {
  const [visible, setVisible] = useState(false);
  const [showBulb] = useState(() => Math.random() < 0.5);

  if (!showBulb) return null;

  return (
    <>
      <TouchableOpacity
        onPress={() => setVisible(true)}
        style={styles.bulbButton}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        activeOpacity={0.7}
      >
        <Image source={hintIcon} style={styles.bulbIcon} resizeMode="contain" />
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{title}</Text>
              <TouchableOpacity
                onPress={() => setVisible(false)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={styles.closeButton}
              >
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.hintText}>{hint}</Text>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  bulbButton: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bulbIcon: {
    width: 18,
    height: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: Layout.spacing.lg,
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Layout.spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.spacing.md,
  },
  modalTitle: {
    fontFamily: Typography.medium,
    fontSize: 16,
    color: Colors.primary,
  },
  closeButton: {
    padding: 4,
  },
  closeText: {
    fontSize: 18,
    color: Colors.text.secondary,
  },
  hintText: {
    fontFamily: Typography.regular,
    fontSize: 14,
    color: Colors.text.primary,
    lineHeight: 22,
  },
});
