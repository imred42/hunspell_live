# Generated by Django 3.2.25 on 2024-11-30 14:33

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Profile',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('birthdate', models.DateField(blank=True, null=True)),
                ('gender', models.CharField(blank=True, choices=[('F', 'Female'), ('M', 'Male'), ('N', 'Non-binary'), ('P', 'Prefer not to say')], max_length=1)),
                ('education', models.CharField(blank=True, choices=[('NO', 'No formal education'), ('ES', 'Elementary School'), ('MS', 'Middle School'), ('HS', 'High School'), ('SC', 'Some College'), ('AS', 'Associate Degree'), ('BS', "Bachelor's Degree"), ('MS', "Master's Degree"), ('PD', 'Professional Degree'), ('PhD', 'Doctorate')], max_length=3)),
                ('currently_enrolled', models.BooleanField(default=False)),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]