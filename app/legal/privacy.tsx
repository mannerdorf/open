import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { useThemeColors } from '@/constants/colors';

export default function PrivacyScreen() {
  const insets = useSafeAreaInsets();
  const Colors = useThemeColors();

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Обработка персональных данных',
          headerBackTitle: 'Назад',
        }}
      />
      <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <ScrollView 
        style={styles.content} 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
      >
        <Text style={[styles.title, { color: Colors.text }]}>Согласие на обработку персональных данных</Text>
        <Text style={[styles.date, { color: Colors.textSecondary }]}>Дата публикации: 01.01.2025</Text>

        <Text style={[styles.sectionTitle, { color: Colors.text }]}>1. Общие положения</Text>
        <Text style={[styles.paragraph, { color: Colors.textSecondary }]}>
          Настоящее Согласие на обработку персональных данных (далее — «Согласие») дается ООО «Логистик Про» (далее — «Оператор») в соответствии с требованиями Федерального закона от 27.07.2006 № 152-ФЗ «О персональных данных».
        </Text>
        <Text style={[styles.paragraph, { color: Colors.textSecondary }]}>
          Регистрируясь в мобильном приложении и/или используя его функционал, Пользователь подтверждает свое согласие на обработку персональных данных на условиях, изложенных ниже.
        </Text>

        <Text style={[styles.sectionTitle, { color: Colors.text }]}>2. Перечень персональных данных</Text>
        <Text style={[styles.paragraph, { color: Colors.textSecondary }]}>
          2.1. Оператор обрабатывает следующие персональные данные Пользователя:
        </Text>
        <Text style={[styles.listItem, { color: Colors.textSecondary }]}>
          • Фамилия, имя, отчество;
        </Text>
        <Text style={[styles.listItem, { color: Colors.textSecondary }]}>
          • Адрес электронной почты;
        </Text>
        <Text style={[styles.listItem, { color: Colors.textSecondary }]}>
          • Номер телефона;
        </Text>
        <Text style={[styles.listItem, { color: Colors.textSecondary }]}>
          • Данные организации (наименование, ИНН, КПП, адрес);
        </Text>
        <Text style={[styles.listItem, { color: Colors.textSecondary }]}>
          • Информация о перевозках и грузах;
        </Text>
        <Text style={[styles.listItem, { color: Colors.textSecondary }]}>
          • Данные об использовании приложения (логи, IP-адрес, информация об устройстве).
        </Text>

        <Text style={[styles.sectionTitle, { color: Colors.text }]}>3. Цели обработки персональных данных</Text>
        <Text style={[styles.paragraph, { color: Colors.textSecondary }]}>
          3.1. Персональные данные обрабатываются в следующих целях:
        </Text>
        <Text style={[styles.listItem, { color: Colors.textSecondary }]}>
          • Регистрация и авторизация Пользователя в приложении;
        </Text>
        <Text style={[styles.listItem, { color: Colors.textSecondary }]}>
          • Оказание логистических услуг;
        </Text>
        <Text style={[styles.listItem, { color: Colors.textSecondary }]}>
          • Обработка заявок на перевозку;
        </Text>
        <Text style={[styles.listItem, { color: Colors.textSecondary }]}>
          • Формирование и предоставление документов;
        </Text>
        <Text style={[styles.listItem, { color: Colors.textSecondary }]}>
          • Информирование о статусе перевозок;
        </Text>
        <Text style={[styles.listItem, { color: Colors.textSecondary }]}>
          • Техническая поддержка и консультирование;
        </Text>
        <Text style={[styles.listItem, { color: Colors.textSecondary }]}>
          • Улучшение качества услуг и функционала приложения;
        </Text>
        <Text style={[styles.listItem, { color: Colors.textSecondary }]}>
          • Направление информационных и рекламных сообщений (при согласии Пользователя).
        </Text>

        <Text style={[styles.sectionTitle, { color: Colors.text }]}>4. Способы обработки персональных данных</Text>
        <Text style={[styles.paragraph, { color: Colors.textSecondary }]}>
          4.1. Оператор осуществляет обработку персональных данных следующими способами:
        </Text>
        <Text style={[styles.listItem, { color: Colors.textSecondary }]}>
          • Сбор, запись, систематизация, накопление, хранение;
        </Text>
        <Text style={[styles.listItem, { color: Colors.textSecondary }]}>
          • Уточнение (обновление, изменение);
        </Text>
        <Text style={[styles.listItem, { color: Colors.textSecondary }]}>
          • Извлечение, использование, передача (распространение, предоставление, доступ);
        </Text>
        <Text style={[styles.listItem, { color: Colors.textSecondary }]}>
          • Обезличивание, блокирование, удаление, уничтожение.
        </Text>
        <Text style={[styles.paragraph, { color: Colors.textSecondary }]}>
          4.2. Обработка персональных данных осуществляется как с использованием средств автоматизации, так и без использования таких средств.
        </Text>

        <Text style={[styles.sectionTitle, { color: Colors.text }]}>5. Передача персональных данных третьим лицам</Text>
        <Text style={[styles.paragraph, { color: Colors.textSecondary }]}>
          5.1. Оператор вправе передавать персональные данные третьим лицам в следующих случаях:
        </Text>
        <Text style={[styles.listItem, { color: Colors.textSecondary }]}>
          • Для исполнения договора на оказание логистических услуг (перевозчикам, экспедиторам);
        </Text>
        <Text style={[styles.listItem, { color: Colors.textSecondary }]}>
          • При наличии согласия Пользователя;
        </Text>
        <Text style={[styles.listItem, { color: Colors.textSecondary }]}>
          • По требованию уполномоченных государственных органов в случаях, предусмотренных законодательством.
        </Text>
        <Text style={[styles.paragraph, { color: Colors.textSecondary }]}>
          5.2. Оператор обеспечивает конфиденциальность персональных данных и требует соблюдения конфиденциальности от третьих лиц, которым передаются данные.
        </Text>

        <Text style={[styles.sectionTitle, { color: Colors.text }]}>6. Меры защиты персональных данных</Text>
        <Text style={[styles.paragraph, { color: Colors.textSecondary }]}>
          6.1. Оператор принимает необходимые правовые, организационные и технические меры для защиты персональных данных от неправомерного или случайного доступа, уничтожения, изменения, блокирования, копирования, предоставления, распространения, а также от иных неправомерных действий.
        </Text>
        <Text style={[styles.paragraph, { color: Colors.textSecondary }]}>
          6.2. Применяются следующие меры защиты:
        </Text>
        <Text style={[styles.listItem, { color: Colors.textSecondary }]}>
          • Шифрование данных при передаче;
        </Text>
        <Text style={[styles.listItem, { color: Colors.textSecondary }]}>
          • Ограничение доступа к персональным данным;
        </Text>
        <Text style={[styles.listItem, { color: Colors.textSecondary }]}>
          • Использование средств защиты информации;
        </Text>
        <Text style={[styles.listItem, { color: Colors.textSecondary }]}>
          • Регулярное резервное копирование данных.
        </Text>

        <Text style={[styles.sectionTitle, { color: Colors.text }]}>7. Права субъекта персональных данных</Text>
        <Text style={[styles.paragraph, { color: Colors.textSecondary }]}>
          7.1. Пользователь имеет право:
        </Text>
        <Text style={[styles.listItem, { color: Colors.textSecondary }]}>
          • Получать информацию об обработке своих персональных данных;
        </Text>
        <Text style={[styles.listItem, { color: Colors.textSecondary }]}>
          • Требовать уточнения, блокирования или уничтожения персональных данных;
        </Text>
        <Text style={[styles.listItem, { color: Colors.textSecondary }]}>
          • Отозвать согласие на обработку персональных данных;
        </Text>
        <Text style={[styles.listItem, { color: Colors.textSecondary }]}>
          • Обжаловать действия или бездействие Оператора в уполномоченный орган по защите прав субъектов персональных данных или в судебном порядке.
        </Text>

        <Text style={[styles.sectionTitle, { color: Colors.text }]}>8. Срок действия согласия</Text>
        <Text style={[styles.paragraph, { color: Colors.textSecondary }]}>
          8.1. Настоящее Согласие действует с момента его предоставления и до момента отзыва Пользователем.
        </Text>
        <Text style={[styles.paragraph, { color: Colors.textSecondary }]}>
          8.2. Пользователь вправе отозвать согласие, направив письменное уведомление Оператору по адресу: info@logistikpro.ru.
        </Text>
        <Text style={[styles.paragraph, { color: Colors.textSecondary }]}>
          8.3. После отзыва согласия Оператор прекращает обработку персональных данных и уничтожает их в срок, не превышающий 30 (тридцати) календарных дней, если иное не предусмотрено законодательством.
        </Text>

        <Text style={[styles.sectionTitle, { color: Colors.text }]}>9. Контактная информация</Text>
        <Text style={[styles.paragraph, { color: Colors.textSecondary }]}>
          По вопросам обработки персональных данных Пользователь может обратиться к Оператору:
        </Text>
        <Text style={[styles.paragraph, { color: Colors.textSecondary }]}>
          ООО «Логистик Про»
        </Text>
        <Text style={[styles.paragraph, { color: Colors.textSecondary }]}>
          Адрес: г. Москва, ул. Тверская, д. 1, офис 100
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
