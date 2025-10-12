import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { useThemeColors } from '@/constants/colors';

export default function OfferScreen() {
  const insets = useSafeAreaInsets();
  const Colors = useThemeColors();

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Публичная оферта',
          headerBackTitle: 'Назад',
        }}
      />
      <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <ScrollView 
        style={styles.content} 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
      >
        <Text style={[styles.title, { color: Colors.text }]}>Публичная оферта</Text>
        <Text style={[styles.date, { color: Colors.textSecondary }]}>Дата публикации: 01.01.2025</Text>

        <Text style={[styles.sectionTitle, { color: Colors.text }]}>1. Общие положения</Text>
        <Text style={[styles.paragraph, { color: Colors.textSecondary }]}>
          Настоящая публичная оферта (далее — «Оферта») является официальным предложением ООО «Логистик Про» (далее — «Исполнитель») заключить договор на оказание логистических услуг (далее — «Договор») на условиях, изложенных ниже.
        </Text>
        <Text style={[styles.paragraph, { color: Colors.textSecondary }]}>
          Акцептом настоящей Оферты является регистрация Заказчика в мобильном приложении и/или оформление заявки на перевозку груза.
        </Text>

        <Text style={[styles.sectionTitle, { color: Colors.text }]}>2. Предмет договора</Text>
        <Text style={[styles.paragraph, { color: Colors.textSecondary }]}>
          2.1. Исполнитель обязуется оказать Заказчику услуги по организации перевозки грузов автомобильным и/или морским транспортом, а Заказчик обязуется принять и оплатить эти услуги.
        </Text>
        <Text style={[styles.paragraph, { color: Colors.textSecondary }]}>
          2.2. Услуги оказываются на основании заявки Заказчика, оформленной через мобильное приложение или иным способом, согласованным сторонами.
        </Text>

        <Text style={[styles.sectionTitle, { color: Colors.text }]}>3. Стоимость услуг и порядок оплаты</Text>
        <Text style={[styles.paragraph, { color: Colors.textSecondary }]}>
          3.1. Стоимость услуг определяется на основании тарифов Исполнителя и указывается в заявке на перевозку.
        </Text>
        <Text style={[styles.paragraph, { color: Colors.textSecondary }]}>
          3.2. Оплата производится на основании выставленного счета в течение 5 (пяти) рабочих дней с момента его получения.
        </Text>
        <Text style={[styles.paragraph, { color: Colors.textSecondary }]}>
          3.3. Оплата может осуществляться безналичным переводом на расчетный счет Исполнителя.
        </Text>

        <Text style={[styles.sectionTitle, { color: Colors.text }]}>4. Права и обязанности сторон</Text>
        <Text style={[styles.paragraph, { color: Colors.textSecondary }]}>
          4.1. Исполнитель обязуется:
        </Text>
        <Text style={[styles.listItem, { color: Colors.textSecondary }]}>
          • Организовать перевозку груза в соответствии с условиями заявки;
        </Text>
        <Text style={[styles.listItem, { color: Colors.textSecondary }]}>
          • Обеспечить сохранность груза в процессе перевозки;
        </Text>
        <Text style={[styles.listItem, { color: Colors.textSecondary }]}>
          • Предоставить Заказчику информацию о статусе перевозки;
        </Text>
        <Text style={[styles.listItem, { color: Colors.textSecondary }]}>
          • Оформить необходимые документы по перевозке.
        </Text>

        <Text style={[styles.paragraph, { color: Colors.textSecondary }]}>
          4.2. Заказчик обязуется:
        </Text>
        <Text style={[styles.listItem, { color: Colors.textSecondary }]}>
          • Предоставить достоверную информацию о грузе;
        </Text>
        <Text style={[styles.listItem, { color: Colors.textSecondary }]}>
          • Обеспечить надлежащую упаковку груза;
        </Text>
        <Text style={[styles.listItem, { color: Colors.textSecondary }]}>
          • Своевременно оплатить услуги Исполнителя;
        </Text>
        <Text style={[styles.listItem, { color: Colors.textSecondary }]}>
          • Принять груз в пункте назначения.
        </Text>

        <Text style={[styles.sectionTitle, { color: Colors.text }]}>5. Ответственность сторон</Text>
        <Text style={[styles.paragraph, { color: Colors.textSecondary }]}>
          5.1. За утрату, недостачу или повреждение груза Исполнитель несет ответственность в размере действительной стоимости груза, но не более объявленной ценности.
        </Text>
        <Text style={[styles.paragraph, { color: Colors.textSecondary }]}>
          5.2. Исполнитель не несет ответственности за задержку доставки, вызванную обстоятельствами непреодолимой силы.
        </Text>
        <Text style={[styles.paragraph, { color: Colors.textSecondary }]}>
          5.3. За просрочку оплаты Заказчик уплачивает пени в размере 0,1% от суммы задолженности за каждый день просрочки.
        </Text>

        <Text style={[styles.sectionTitle, { color: Colors.text }]}>6. Порядок рассмотрения претензий</Text>
        <Text style={[styles.paragraph, { color: Colors.textSecondary }]}>
          6.1. Претензии по качеству оказанных услуг принимаются в письменном виде в течение 30 (тридцати) календарных дней с момента оказания услуг.
        </Text>
        <Text style={[styles.paragraph, { color: Colors.textSecondary }]}>
          6.2. Претензии рассматриваются в течение 10 (десяти) рабочих дней с момента получения.
        </Text>
        <Text style={[styles.paragraph, { color: Colors.textSecondary }]}>
          6.3. Претензии могут быть поданы через мобильное приложение в разделе «Поддержка».
        </Text>

        <Text style={[styles.sectionTitle, { color: Colors.text }]}>7. Срок действия договора</Text>
        <Text style={[styles.paragraph, { color: Colors.textSecondary }]}>
          7.1. Договор вступает в силу с момента акцепта Оферты и действует до полного исполнения обязательств сторонами.
        </Text>
        <Text style={[styles.paragraph, { color: Colors.textSecondary }]}>
          7.2. Любая из сторон вправе расторгнуть Договор в одностороннем порядке, уведомив другую сторону за 10 (десять) календарных дней.
        </Text>

        <Text style={[styles.sectionTitle, { color: Colors.text }]}>8. Реквизиты Исполнителя</Text>
        <Text style={[styles.paragraph, { color: Colors.textSecondary }]}>
          ООО «Логистик Про»
        </Text>
        <Text style={[styles.paragraph, { color: Colors.textSecondary }]}>
          ИНН: 7707083893
        </Text>
        <Text style={[styles.paragraph, { color: Colors.textSecondary }]}>
          КПП: 770701001
        </Text>
        <Text style={[styles.paragraph, { color: Colors.textSecondary }]}>
          ОГРН: 1157746123456
        </Text>
        <Text style={[styles.paragraph, { color: Colors.textSecondary }]}>
          Юридический адрес: г. Москва, ул. Тверская, д. 1, офис 100
        </Text>
        <Text style={[styles.paragraph, { color: Colors.textSecondary }]}>
          Телефон: +7 (495) 123-45-67
        </Text>
        <Text style={[styles.paragraph, { color: Colors.textSecondary }]}>
          Email: info@logistikpro.ru
        </Text>
      </ScrollView>
    </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  date: {
    fontSize: 14,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    marginTop: 24,
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  listItem: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 8,
    paddingLeft: 8,
  },
});
